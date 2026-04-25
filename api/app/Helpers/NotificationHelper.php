<?php

namespace App\Helpers;

use App\Models\Notification;
use App\Models\PushSubscription;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use Throwable;

class NotificationHelper
{
    /**
     * Create a notification record and optionally send a web push.
     */
    public static function send(int $userId, string $type, string $title, string $message, ?array $data = null): Notification
    {
        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        static::dispatchWebPush(
            $userId,
            $title,
            $message,
            $type,
            array_merge($data ?? [], [
                'notification_id' => $notification->id,
            ])
        );

        return $notification;
    }

    /**
     * Send web push to all browser subscriptions for the user.
     */
    public static function dispatchWebPush(int $userId, string $title, string $message, string $type = 'system', ?array $data = null): void
    {
        $vapidPublic = config('app.vapid_public_key');
        $vapidPrivate = config('app.vapid_private_key');
        $vapidSubject = config('app.vapid_subject', 'mailto:admin@sukicart.ph');

        if (!$vapidPublic || !$vapidPrivate) {
            return;
        }

        $subscriptions = PushSubscription::where('user_id', $userId)->get();
        if ($subscriptions->isEmpty()) {
            return;
        }

        $auth = [
            'VAPID' => [
                'subject' => $vapidSubject,
                'publicKey' => $vapidPublic,
                'privateKey' => $vapidPrivate,
            ],
        ];

        $webPush = new WebPush($auth);

        $payload = json_encode([
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'data' => $data,
        ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);

        if ($payload === false) {
            \Illuminate\Support\Facades\Log::warning('[WebPush] Failed to encode push payload', [
                'user_id' => $userId,
                'title' => $title,
                'type' => $type,
                'json_error' => json_last_error_msg(),
            ]);

            return;
        }

        $expiredEndpoints = [];

        foreach ($subscriptions as $sub) {
            try {
                $subscription = Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'keys' => [
                        'p256dh' => $sub->public_key,
                        'auth' => $sub->auth_token,
                    ],
                ]);

                $report = $webPush->sendOneNotification($subscription, $payload);

                if (!$report->isSuccess()) {
                    $response = $report->getResponse();
                    $statusCode = $response?->getStatusCode();

                    \Illuminate\Support\Facades\Log::warning('[WebPush] Failed to send push notification', [
                        'endpoint' => $sub->endpoint,
                        'status_code' => $statusCode,
                        'reason' => $report->getReason(),
                        'response' => $report->getResponseContent(),
                    ]);

                    if (in_array($statusCode, [404, 410], true)) {
                        $expiredEndpoints[] = $sub->endpoint;
                    }
                }
            } catch (Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('[WebPush] Exception while sending push notification', [
                    'endpoint' => $sub->endpoint,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if (!empty($expiredEndpoints)) {
            PushSubscription::whereIn('endpoint', $expiredEndpoints)->delete();
        }
    }
}
