"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Notification } from "@/types/notifications";
import { supabase } from "@/lib/supabase/api";
import { useUser } from "@/lib/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Subscribe to notifications channel
    const channel = supabase.channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          setNotifications((prev) => [notification, ...prev]);
          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      )
      .subscribe();

    // Subscribe to achievements channel
    const achievementsChannel = supabase.channel(`achievements:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'achievements',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const achievement = payload.new as any;
          // Fetch badge details
          const { data: badge } = await supabase
            .from('badges')
            .select('name, description')
            .eq('id', achievement.badge_id)
            .single();

          if (badge) {
            toast({
              title: "New Achievement!",
              description: `You've earned the "${badge.name}" badge!`,
            });
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      channel.unsubscribe();
      achievementsChannel.unsubscribe();
    };
  }, [user]);

  const addNotification = async (
    notification: Omit<Notification, "id" | "timestamp">
  ) => {
    if (!user) return;

    const newNotification = await supabase
      .from('notifications')
      .insert({ user_id: user.id, ...notification })
      .single();

    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, markAsRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
