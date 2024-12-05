"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar } from "lucide-react";
import { useUser } from "@/lib/hooks/use-user";
import { supabase } from "@/lib/supabase/client";
import { format, parseISO } from "date-fns";
import { useToast } from "@/lib/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ScheduleEvent {
  id: string;
  title: string;
  type: 'class' | 'assignment' | 'meeting';
  start_time: string;
  end_time: string;
  course_id?: string;
  course?: {
    title: string;
  };
}

export function ScheduleOverview() {
  const router = useRouter();
  const { user, profile } = useUser();
  const { toast } = useToast();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedule() {
      if (!user || !profile) return;

      try {
        let query = supabase
          .from('schedule_events')
          .select(`
            *,
            course:courses (
              title
            )
          `)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(5);

        if (profile.role === 'teacher') {
          query = query.eq('teacher_id', user.id);
        } else if (profile.role === 'student') {
          query = query.eq('student_id', user.id);
        }

        const { data, error } = await query;

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        toast({
          title: "Error",
          description: "Failed to load schedule. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSchedule();
  }, [user, profile, toast]);

  const handleAddEvent = () => {
    if (profile?.role !== 'teacher') {
      toast({
        title: "Access Denied",
        description: "Only teachers can add new events.",
        variant: "destructive",
      });
      return;
    }
    router.push('/dashboard/schedule/new');
  };

  const getEventDuration = (start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const diffMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    return `${diffMinutes} min`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Loading schedule...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Upcoming Schedule</CardTitle>
        {profile?.role === 'teacher' && (
          <Button size="sm" onClick={handleAddEvent}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Calendar className="mx-auto h-8 w-8 mb-4" />
            <p>No upcoming events scheduled</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    {event.title}
                    {event.course && (
                      <div className="text-sm text-muted-foreground">
                        {event.course.title}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        event.type === "class"
                          ? "default"
                          : event.type === "assignment"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {event.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(parseISO(event.start_time), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    {getEventDuration(event.start_time, event.end_time)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
