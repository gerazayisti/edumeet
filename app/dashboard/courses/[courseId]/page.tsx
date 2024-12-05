"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/use-user";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { BookOpen, Calendar, Users, FileText, Clock } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  teacher: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  assignments: Assignment[];
  total_students: number;
}

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useUser();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    async function fetchCourseDetails() {
      if (!user || !params.courseId) return;

      try {
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select(`
            *,
            teacher:profiles!courses_teacher_id_fkey (
              id,
              full_name,
              avatar_url
            ),
            assignments (
              id,
              title,
              description,
              due_date,
              completed
            ),
            course_enrollments (
              student_id
            )
          `)
          .eq("id", params.courseId)
          .single();

        if (courseError) throw courseError;

        if (courseData) {
          // Check if user is enrolled
          const isEnrolled = courseData.course_enrollments.some(
            (enrollment: any) => enrollment.student_id === user.id
          );
          setEnrolled(isEnrolled);

          // Get total number of students
          const { count } = await supabase
            .from("course_enrollments")
            .select("*", { count: "exact" })
            .eq("course_id", params.courseId);

          setCourse({
            ...courseData,
            total_students: count || 0,
            assignments: courseData.assignments || [],
          });
        }
      } catch (error) {
        console.error("Error fetching course details:", error);
        toast({
          title: "Error",
          description: "Failed to load course details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCourseDetails();
  }, [user, params.courseId, toast]);

  const handleEnroll = async () => {
    if (!user || !course) return;

    try {
      const { error } = await supabase
        .from("course_enrollments")
        .insert({
          course_id: course.id,
          student_id: user.id,
        });

      if (error) throw error;

      setEnrolled(true);
      toast({
        title: "Success",
        description: "You have been enrolled in the course.",
      });
    } catch (error) {
      console.error("Error enrolling in course:", error);
      toast({
        title: "Error",
        description: "Failed to enroll in course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAssignmentToggle = async (assignmentId: string, completed: boolean) => {
    if (!user || !course) return;

    try {
      const { error } = await supabase
        .from("assignment_submissions")
        .upsert({
          assignment_id: assignmentId,
          student_id: user.id,
          completed,
        });

      if (error) throw error;

      setCourse({
        ...course,
        assignments: course.assignments.map(assignment =>
          assignment.id === assignmentId
            ? { ...assignment, completed }
            : assignment
        ),
      });

      toast({
        title: "Success",
        description: completed
          ? "Assignment marked as completed"
          : "Assignment marked as incomplete",
      });
    } catch (error) {
      console.error("Error updating assignment status:", error);
      toast({
        title: "Error",
        description: "Failed to update assignment status. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  const completedAssignments = course.assignments.filter(a => a.completed).length;
  const progress = course.assignments.length
    ? (completedAssignments / course.assignments.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>
        {profile?.role === "student" && !enrolled && (
          <Button onClick={handleEnroll}>Enroll in Course</Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Course Status
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge
                variant={
                  course.status === "active"
                    ? "default"
                    : course.status === "draft"
                    ? "secondary"
                    : "outline"
                }
              >
                {course.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.total_students}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Course Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {format(new Date(course.start_date), "MMM d, yyyy")} -{" "}
              {format(new Date(course.end_date), "MMM d, yyyy")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assignments
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.assignments.length}</div>
          </CardContent>
        </Card>
      </div>

      {profile?.role === "student" && enrolled && (
        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>
              Track your progress in this course
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">
              {completedAssignments} of {course.assignments.length} assignments completed
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{course.description}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Instructor</h3>
                <div className="flex items-center space-x-2">
                  {course.teacher.avatar_url && (
                    <img
                      src={course.teacher.avatar_url}
                      alt={course.teacher.full_name}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <span>{course.teacher.full_name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {course.assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  {profile?.role === "student" && enrolled && (
                    <Button
                      variant={assignment.completed ? "default" : "outline"}
                      onClick={() =>
                        handleAssignmentToggle(assignment.id, !assignment.completed)
                      }
                    >
                      {assignment.completed ? "Completed" : "Mark as Complete"}
                    </Button>
                  )}
                </div>
                <CardDescription>
                  Due: {format(new Date(assignment.due_date), "PPP")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {assignment.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Resources</CardTitle>
              <CardDescription>
                Access course materials and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO: Implement course resources */}
              <p className="text-muted-foreground">
                Course resources will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
