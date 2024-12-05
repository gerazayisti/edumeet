"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  BookOpen,
  Calendar as CalendarIcon,
  GraduationCap,
  Users,
  Clock,
  Target,
  TrendingUp,
  Award,
} from "lucide-react";
import { useUser } from "@/lib/hooks/use-user";
import { useCourses } from "@/lib/hooks/use-courses";
import { useAssignments } from "@/lib/hooks/use-assignments";
import { useProgress } from "@/lib/hooks/use-progress";
import { useMeetings } from "@/lib/hooks/use-meetings";
import { format } from "date-fns";

export function DashboardOverview() {
  const { user } = useUser();
  const { courses } = useCourses();
  const { assignments } = useAssignments();
  const { courseProgress, studyStats } = useProgress();
  const { meetings } = useMeetings();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Calculate stats from real data
  const pendingAssignments = assignments?.filter(a => !a.submitted)?.length || 0;
  const completionRate = studyStats?.completionRate || 0;
  const totalStudyHours = Math.round((studyStats?.totalStudyTime || 0) / 60); // Convert minutes to hours

  // Get upcoming events
  const upcomingEvents = [
    ...(assignments?.filter(a => !a.submitted)?.map(a => ({
      id: a.id,
      title: a.title,
      date: format(new Date(a.due_date), "PPp"),
      type: "assignment" as const
    })) || []),
    ...(meetings?.filter(m => new Date(m.start_time) > new Date())?.map(m => ({
      id: m.id,
      title: m.title,
      date: format(new Date(m.start_time), "PPp"),
      type: "meeting" as const
    })) || [])
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
   .slice(0, 5); // Show only next 5 events

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {courses?.length ? "Courses in progress" : "No active courses"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(completionRate)}%</div>
            <Progress value={completionRate} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Assignments due soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudyHours}h</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>Your upcoming events and deadlines</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-b border-muted pb-4">
              <Calendar 
                  events={upcomingEvents.map(event => ({
                    ...event,
                    date: new Date(event.date),
                    description: event.description || undefined,
                    duration: event.duration || undefined,
                  }))}
                  onEventClick={(event) => {
                    // Navigate to the appropriate page based on event type
                    window.location.href = event.type === "assignment"
                      ? `/assignments/${event.id}`
                      : `/meetings/${event.id}`;
                  }}
                />
            </div>
            <div className="space-y-4 pt-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    {event.type === "assignment" ? (
                      <BookOpen className="h-4 w-4" />
                    ) : event.type === "class" ? (
                      <GraduationCap className="h-4 w-4" />
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.date}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Navigate to the appropriate page based on event type
                      window.location.href = event.type === "assignment"
                        ? `/assignments/${event.id}`
                        : `/meetings/${event.id}`;
                    }}
                  >
                    View
                  </Button>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No upcoming events
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
            <CardDescription>Track your learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {courseProgress.map((course) => {
                  const progress = Math.round(
                    ((course.completed_modules / course.total_modules) +
                    (course.completed_assignments / course.total_assignments)) * 50
                  );
                  
                  return (
                    <div key={course.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{course.course?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {progress}% completed
                          </p>
                        </div>
                        {progress >= 90 ? (
                          <Award className="h-4 w-4 text-green-500" />
                        ) : progress >= 70 ? (
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Target className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          Modules: {course.completed_modules}/{course.total_modules}
                        </div>
                        <div>
                          Assignments: {course.completed_assignments}/{course.total_assignments}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {courseProgress.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No course progress available
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
