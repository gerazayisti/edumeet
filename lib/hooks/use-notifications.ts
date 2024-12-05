"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/api";
import { useUser } from "./use-user";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "achievement" | "warning" | "error";
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      // Get notifications
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const { data, error } = await supabase.rpc(
        "mark_notifications_read",
        {
          p_user_id: user?.id,
          p_notification_ids: notificationIds,
        }
      );

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );

      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));

      return { data, error: null };
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      return { data: null, error };
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.read)
      .map(n => n.id);

    if (unreadIds.length === 0) return;

    return markAsRead(unreadIds);
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user?.id);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const wasUnread = notifications.find(n => n.id === notificationId && !n.read);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      return { error: null };
    } catch (error) {
      console.error("Error deleting notification:", error);
      return { error };
    }
  };

  const clearAll = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user?.id);

      if (error) throw error;

      // Update local state
      setNotifications([]);
      setUnreadCount(0);

      return { error: null };
    } catch (error) {
      console.error("Error clearing notifications:", error);
      return { error };
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh: loadNotifications,
  };
}
