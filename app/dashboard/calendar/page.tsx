"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/hooks/use-user";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { format, parseISO, startOfToday } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  course_id?: string;
  event_type: "assignment" | "class" | "meeting" | "other";
  created_by: string;
}

export default function CalendarPage() {
  const { user, profile } = useUser();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [events, setEvents] = useState<Event[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    course_id: "",
    event_type: "other" as const,
  });

  useEffect(() => {
    if (!user) return;

    const fetchEvents = async () => {
      try {
        // Fetch events based on user role
        let query = supabase
          .from("calendar_events")
          .select("*")
          .order("start_time", { ascending: true });

        if (profile?.role === "student") {
          // For students, fetch events for their enrolled courses
          const { data: enrollments } = await supabase
            .from("course_enrollments")
            .select("course_id")
            .eq("student_id", user.id);

          if (enrollments && enrollments.length > 0) {
            const courseIds = enrollments.map((e) => e.course_id);
            query = query.in("course_id", courseIds);
          }
        }

        const { data, error } = await query;

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Failed to load calendar events",
          variant: "destructive",
        });
      }
    };

    const fetchCourses = async () => {
      try {
        let query = supabase.from("courses").select("*");

        if (profile?.role === "student") {
          // For students, only fetch enrolled courses
          query = query
            .select("*, course_enrollments!inner(*)")
            .eq("course_enrollments.student_id", user.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        setCourses(data || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchEvents();
    fetchCourses();

    // Subscribe to calendar events
    const eventsSubscription = supabase
      .channel("calendar_events")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calendar_events",
        },
        (payload) => {
          fetchEvents(); // Refresh events when changes occur
        }
      )
      .subscribe();

    return () => {
      eventsSubscription.unsubscribe();
    };
  }, [user, profile, toast]);

  const handleAddEvent = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from("calendar_events").insert({
        ...newEvent,
        created_by: user.id,
      });

      if (error) throw error;

      setIsAddEventOpen(false);
      setNewEvent({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        course_id: "",
        event_type: "other",
      });

      toast({
        title: "Success",
        description: "Event added successfully",
      });
    } catch (error) {
      console.error("Error adding event:", error);
      toast({
        title: "Error",
        description: "Failed to add event",
        variant: "destructive",
      });
    }
  };

  const getDayEvents = (date: Date) => {
    return events.filter((event) => {
      const eventDate = parseISO(event.start_time);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const selectedDateEvents = getDayEvents(selectedDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Manage your schedule and upcoming events
          </p>
        </div>
        {profile?.role === "teacher" && (
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={newEvent.start_time}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, start_time: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="datetime-local"
                      value={newEvent.end_time}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, end_time: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select
                    value={newEvent.course_id}
                    onValueChange={(value) =>
                      setNewEvent({ ...newEvent, course_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={newEvent.event_type}
                    onValueChange={(value: any) =>
                      setNewEvent({ ...newEvent, event_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="class">Class</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddEvent} className="w-full">
                  Add Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>
                Events for {format(selectedDate, "MMMM d, yyyy")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedDateEvents.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No events scheduled for this day
                </p>
              ) : (
                selectedDateEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(parseISO(event.start_time), "h:mm a")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(event.end_time), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}