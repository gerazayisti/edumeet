"use client";

import { useState } from "react";
import { useUser } from "@/lib/hooks/use-user";
import { useToast } from "@/lib/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bell, Book, Calendar, CheckCircle2, Clock, MessageSquare } from "lucide-react";

interface Notification {
  id: string;
  type: "assignment" | "course" | "message" | "reminder" | "announcement";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  courseName?: string;
}

export default function NotificationsPage() {
  const { user, profile } = useUser();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "assignment",
      title: "New Assignment: React Fundamentals",
      description: "A new assignment has been posted in Web Development course",
      timestamp: "2024-01-15T10:00:00Z",
      read: false,
      actionUrl: "/dashboard/courses/web-dev/assignments/1",
      courseName: "Web Development",
    },
    {
      id: "2",
      type: "course",
      title: "Course Update: JavaScript Basics",
      description: "New course materials have been added",
      timestamp: "2024-01-14T15:30:00Z",
      read: true,
      actionUrl: "/dashboard/courses/js-basics",
      courseName: "JavaScript Basics",
    },
    {
      id: "3",
      type: "message",
      title: "New Message from John Doe",
      description: "Hey, I have a question about the latest assignment...",
      timestamp: "2024-01-14T09:15:00Z",
      read: false,
      actionUrl: "/dashboard/messages/123",
    },
    // Add more sample notifications as needed
  ]);

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    toast({
      title: "Success",
      description: "All notifications marked as read",
    });
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast({
      title: "Success",
      description: "All notifications cleared",
    });
  };

  const NotificationIcon = ({ type }: { type: Notification["type"] }) => {
    switch (type) {
      case "assignment":
        return <Book className="h-6 w-6" />;
      case "course":
        return <Calendar className="h-6 w-6" />;
      case "message":
        return <MessageSquare className="h-6 w-6" />;
      case "reminder":
        return <Clock className="h-6 w-6" />;
      case "announcement":
        return <Bell className="h-6 w-6" />;
      default:
        return <Bell className="h-6 w-6" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const minutes = Math.floor(diffInHours * 60);
        return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
      }
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!user || !profile) {
    return <div>Loading...</div>;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your courses and assignments
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
          <Button
            variant="outline"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
          >
            Clear all
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Bell className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">No notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          </div>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.read ? "opacity-75" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <NotificationIcon type={notification.type} />
                    <div>
                      <CardTitle className="text-lg">
                        {notification.title}
                        {!notification.read && (
                          <Badge variant="default" className="ml-2">
                            New
                          </Badge>
                        )}
                      </CardTitle>
                      {notification.courseName && (
                        <CardDescription>
                          Course: {notification.courseName}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatTimestamp(notification.timestamp)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {notification.description}
                </p>
                <div className="flex items-center space-x-2">
                  {notification.actionUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={notification.actionUrl}>View Details</a>
                    </Button>
                  )}
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
