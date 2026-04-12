<?php
namespace App\Http\Controllers\Notification;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * List the authenticated user's notifications (paginated).
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 20), 100);

        $notifications = Notification::where('user_id', Auth::id())
            ->latest()
            ->paginate($perPage);

        return response()->json($notifications);
    }

    /**
     * Unread count for the notification bell badge.
     */
    public function unreadCount(): JsonResponse
    {
        $count = Notification::where('user_id', Auth::id())
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markRead(int $id): JsonResponse
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead(): JsonResponse
    {
        Notification::where('user_id', Auth::id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    /**
     * Delete a single notification.
     */
    public function destroy(int $id): JsonResponse
    {
        Notification::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail()
            ->delete();

        return response()->json(['message' => 'Notification deleted.']);
    }

    // ── Push subscription management ─────────────────────────────────────

    /**
     * Save a browser push subscription for web push delivery.
     */
    public function savePushSubscription(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint'   => 'required|string|max:2048',
            'public_key' => 'required|string',
            'auth_token' => 'required|string',
        ]);

        PushSubscription::updateOrCreate(
            ['endpoint' => $request->endpoint],
            [
                'user_id'    => Auth::id(),
                'public_key' => $request->public_key,
                'auth_token' => $request->auth_token,
                'user_agent' => $request->userAgent(),
            ]
        );

        return response()->json(['message' => 'Push subscription saved.'], 201);
    }

    /**
     * Remove a push subscription (e.g. when user revokes permission or logs out).
     */
    public function deletePushSubscription(Request $request): JsonResponse
    {
        $request->validate(['endpoint' => 'required|string']);

        PushSubscription::where('user_id', Auth::id())
            ->where('endpoint', $request->endpoint)
            ->delete();

        return response()->json(['message' => 'Push subscription removed.']);
    }

    /**
     * Return VAPID public key for the browser to subscribe.
     */
    public function vapidPublicKey(): JsonResponse
    {
        return response()->json([
            'vapid_public_key' => config('app.vapid_public_key', ''),
        ]);
    }
}
