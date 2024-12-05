"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Calendar, BookOpen } from "lucide-react";
import { CourseForm } from "@/components/courses/course-form";
import { useToast } from "@/lib/hooks/use-toast";
import { useUser } from "@/lib/hooks/use-user";
import { supabase } from "@/lib/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Course {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  teacher?: {
    full_name: string;
  };
  progress?: number;
  total_assignments?: number;
  completed_assignments?: number;
}

export default function CoursesPage() {
  const router = useRouter();
  const { user, profile } = useUser();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      if (!user || !profile) return;

      try {
        let query = supabase
          .from("courses")
          .select(`
            *,
            teacher:profiles!courses_teacher_id_fkey(full_name),
            course_enrollments!inner (
              student_id,
              assignments (
                id,
                completed
              )
            )
          `);

        if (profile.role === 'teacher') {
          query = query.eq("teacher_id", user.id);
        } else if (profile.role === 'student') {
          query = query.eq("course_enrollments.student_id", user.id);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;

        // Process the courses data
        const processedCourses = data?.map(course => {
          const assignments = course.course_enrollments?.[0]?.assignments || [];
          const completed = assignments.filter(a => a.completed).length;
          const progress = assignments.length ? (completed / assignments.length) * 100 : 0;

          return {
            ...course,
            progress,
            total_assignments: assignments.length,
            completed_assignments: completed,
          };
        });

        setCourses(processedCourses || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast({
          title: "Error",
          description: "Failed to load courses. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [user, profile, toast]);

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setFormOpen(true);
  };

  const handleDelete = async (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;

    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseToDelete.id);

      if (error) throw error;

      setCourses(courses.filter((c) => c.id !== courseToDelete.id));
      toast({
        title: "Course deleted",
        description: "The course has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("course_enrollments")
        .insert({
          course_id: courseId,
          student_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Enrolled Successfully",
        description: "You have been enrolled in the course.",
      });

      // Refresh courses
      router.refresh();
    } catch (error) {
      console.error("Error enrolling in course:", error);
      toast({
        title: "Error",
        description: "Failed to enroll in course. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {profile?.role === 'teacher' ? 'Manage Courses' : 'My Courses'}
          </h1>
          <p className="text-muted-foreground">
            {profile?.role === 'teacher' 
              ? 'Create and manage your courses'
              : 'View and track your enrolled courses'}
          </p>
        </div>
        {profile?.role === 'teacher' && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{course.title}</CardTitle>
                <Badge variant={
                  course.status === 'active' ? 'default' :
                  course.status === 'draft' ? 'secondary' : 'outline'
                }>
                  {course.status}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {course.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.role === 'student' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(course.progress || 0)}%</span>
                  </div>
                  <Progress value={course.progress} />
                  <p className="text-sm text-muted-foreground">
                    {course.completed_assignments} of {course.total_assignments} assignments completed
                  </p>
                </div>
              )}
              <div className="space-y-2 text-sm">
                {profile?.role === 'student' && course.teacher && (
                  <div className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Instructor: {course.teacher.full_name}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(course.start_date), "MMM d, yyyy")} -{" "}
                    {format(new Date(course.end_date), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end space-x-2">
              {profile?.role === 'teacher' ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(course)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(course)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </>
              ) : (
                <Button onClick={() => router.push(`/dashboard/courses/${course.id}`)}>
                  View Course
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {profile?.role === 'teacher' && (
        <CourseForm
          open={formOpen}
          onOpenChange={setFormOpen}
          course={selectedCourse}
          onSuccess={() => {
            setFormOpen(false);
            setSelectedCourse(undefined);
            router.refresh();
          }}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course
              and remove all data associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}