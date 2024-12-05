"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Video,
  Users,
  Calendar,
  Monitor,
  Hand,
  Heart,
  ThumbsUp,
} from "lucide-react";
import { meetingsApi } from "@/lib/supabase/api";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function MeetingList() {
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const data = await meetingsApi.getAll();
      setMeetings(data);
    } catch (error) {
      console.error("Error loading meetings:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "text-blue-500";
      case "in_progress":
        return "text-green-500";
      case "completed":
        return "text-gray-500";
      case "cancelled":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "class":
        return <Video className="h-4 w-4" />;
      case "office_hours":
        return <Users className="h-4 w-4" />;
      case "group_study":
        return <Users className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => (
        <Card key={meeting.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>{meeting.title}</CardTitle>
                <CardDescription>
                  {formatDistanceToNow(new Date(meeting.start_time), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Monitor className="mr-2 h-4 w-4" />
                  Partager l'écran
                </Button>
                <Button variant="outline" size="sm">
                  <Hand className="mr-2 h-4 w-4" />
                  Lever la main
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(meeting.type)}
                  <span className="text-sm text-muted-foreground">
                    {meeting.type === "class"
                      ? "Cours"
                      : meeting.type === "office_hours"
                      ? "Heures de bureau"
                      : "Étude de groupe"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {meeting.participants?.length || 0} participants
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="px-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="ml-1">12</span>
                </Button>
                <Button variant="ghost" size="sm" className="px-2">
                  <ThumbsUp className="h-4 w-4 text-blue-500" />
                  <span className="ml-1">8</span>
                </Button>
                <Button variant="ghost" size="sm" className="px-2">
                  <Hand className="h-4 w-4 text-yellow-500" />
                  <span className="ml-1">3</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
