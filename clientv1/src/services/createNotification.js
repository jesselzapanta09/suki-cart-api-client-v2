import { request } from "./notificationService";

export function createNotification({ type, title, message }) {
    return request("/api/notifications", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ type, title, message }),
    });
}
