<?php

namespace App\Helpers;

use App\Models\Notification;
use App\Models\PushSubscription;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class NotificationHelper
{
    /**
     * Create a notification record and optionally send a web push.
     */
    public static function send(int $userId, string $type, string $title, string $message, ?array $data = null): Notification
    {
        $notification = Notification::create([
            'user_id' => $userId,
            'type'    => $type,
            'title'   => $title,
            'message' => $message,
            'data'    => $data,
        ]);

        static::dispatchWebPush($userId, $title, $message, $type, $data);

        return $notification;
    }

    /**
     * Send web push to all browser subscriptions for the user.
     */
    public static function dispatchWebPush(int $userId, string $title, string $message, string $type = 'system', ?array $data = null): void
    {
        $vapidPublic  = config('app.vapid_public_key');
        $vapidPrivate = config('app.vapid_private_key');
        $vapidSubject = config('app.vapid_subject', 'mailto:admin@sukicart.ph');

        if (!$vapidPublic || !$vapidPrivate) {
            return; // VAPID not configured yet (e.g. during development setup)
        }

        $subscriptions = PushSubscription::where('user_id', $userId)->get();
        if ($subscriptions->isEmpty()) {
            return;
        }

        $auth = [
            'VAPID' => [
                'subject'    => $vapidSubject,
                'publicKey'  => $vapidPublic,
                'privateKey' => $vapidPrivate,
            ],
        ];

        $webPush = new WebPush($auth);

        $payload = json_encode([
            'title'   => $title,
            'message' => $message,
            'type'    => $type,
            'data'    => $data,
        ]);

        $expiredEndpoints = [];

        foreach ($subscriptions as $sub) {
            $subscription = Subscription::create([
                'endpoint' => $sub->endpoint,
                'keys'     => [
                    'p256dh' => $sub->public_key,
                    'auth'   => $sub->auth_token,
                ],
            ]);

            $report = $webPush->sendOneNotification($subscription, $payload);

            if (!$report->isSuccess()) {
                // Log the reason so we can debug
                \Illuminate\Support\Facades\Log::warning('[WebPush] Failed to send push notification', [
                    'endpoint' => $sub->endpoint,
                    'reason'   => $report->getReason(),
                    'response' => $report->getResponseContent(),
                ]);
                // Subscription is expired or invalid — clean it up
                $expiredEndpoints[] = $sub->endpoint;
            }
        }

        if (!empty($expiredEndpoints)) {
            PushSubscription::whereIn('endpoint', $expiredEndpoints)->delete();
        }
    }
}
