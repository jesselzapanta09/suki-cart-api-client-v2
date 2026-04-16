import React, { useState, useEffect, useCallback } from "react";
import { Badge, Dropdown } from "antd";
import { Bell, ShoppingBag, Tag, Settings, Store, CheckCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    getNotifications,
    getUnreadCount,
    markRead,
    markAllRead,
} from "../services/notificationService";

const TYPE_META = {
    order:  { icon: ShoppingBag, bg: "bg-green-100",  text: "text-green-600"  },
    promo:  { icon: Tag,         bg: "bg-orange-100", text: "text-orange-500" },
    store:  { icon: Store,       bg: "bg-purple-100", text: "text-purple-600" },
    system: { icon: Settings,    bg: "bg-blue-100",   text: "text-blue-500"   },
};

function getTypeMeta(type) {
    return TYPE_META[type] ?? TYPE_META.system;
}

function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs  < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAdmin, isSeller } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unread,        setUnread]        = useState(0);
    const [open,          setOpen]          = useState(false);

    const notificationsPath = isAdmin
        ? "/notifications"
        : isSeller
            ? "/seller/notifications"
            : "/customer/notifications";

    const refreshCount = useCallback(async () => {
        try {
            const res = await getUnreadCount();
            setUnread(res.count ?? 0);
        } catch { /* empty */ }
    }, []);

    useEffect(() => {
        // Defer initial refreshCount to avoid setState in effect body
        const timeout = setTimeout(refreshCount, 0);
        // Reduced polling frequency: once every 30 seconds instead of every 5 seconds
        const id = setInterval(refreshCount, 30000);
        return () => {
            clearTimeout(timeout);
            clearInterval(id);
        };
    }, [refreshCount]);

    const onOpenChange = useCallback(async (visible) => {
        setOpen(visible);
        if (!visible) return;
        try {
            const [countRes, listRes] = await Promise.all([
                getUnreadCount(),
                getNotifications(1, 10),
            ]);
            setUnread(countRes.count ?? 0);
            setNotifications(listRes.data ?? []);
        } catch { /* empty */ }
    }, []);

    const handleMarkRead = async (e, id) => {
        e.stopPropagation();
        try {
            await markRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
            );
            setUnread(prev => Math.max(0, prev - 1));
        } catch { /* empty */ }
    };

    const handleMarkAllRead = async (e) => {
        e.stopPropagation();
        try {
            await markAllRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
            );
            setUnread(0);
        } catch { /* empty */ }
    };

    const panel = (
        <div className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-green-900 text-sm">Notifications</span>
                {unread > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-800 cursor-pointer bg-transparent border-none"
                    >
                        <CheckCheck size={13} /> Mark all read
                    </button>
                )}
            </div>
            <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-sm">No notifications</div>
                ) : (
                    notifications.map(n => {
                        const meta = getTypeMeta(n.type);
                        const Icon = meta.icon;
                        return (
                            <div
                                key={n.id}
                                onClick={(e) => {
                                    // Mark as read if unread
                                    if (!n.read_at) handleMarkRead(e, n.id);
                                    // Navigate or reload based on URL
                                    if (n.data && n.data.url) {
                                        setOpen(false);
                                        if (location.pathname === n.data.url) {
                                            // Same URL - reload the page
                                            window.location.reload();
                                        } else {
                                            // Different URL - navigate
                                            navigate(n.data.url);
                                        }
                                    }
                                }}
                                className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${!n.read_at ? "bg-green-50/60" : ""}`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.bg}`}>
                                    <Icon size={14} className={meta.text} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-xs font-semibold ${!n.read_at ? "text-green-900" : "text-gray-700"}`}>
                                            {n.title}
                                        </span>
                                        {!n.read_at && (
                                            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.message}</p>
                                    <span className="text-[10px] text-gray-400 mt-1 block">{timeAgo(n.created_at)}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <div className="px-4 py-2.5 text-center border-t border-gray-100">
                <button
                    onClick={() => { setOpen(false); navigate(notificationsPath); }}
                    className="text-xs text-green-600 font-medium cursor-pointer hover:underline bg-transparent border-none"
                >
                    View all notifications
                </button>
            </div>
        </div>
    );

    return (
        <Dropdown
            popupRender={() => panel}
            trigger={["click"]}
            placement="bottomRight"
            open={open}
            onOpenChange={onOpenChange}
        >
            <button className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-700 transition-colors cursor-pointer border-none">
                <Badge count={unread} size="small" color="#16a34a" offset={[2, -2]}>
                    <Bell size={18} />
                </Badge>
            </button>
        </Dropdown>
    );
}
