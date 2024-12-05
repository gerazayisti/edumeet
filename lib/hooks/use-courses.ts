import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/api";
import { useUser } from "./use-user";

export interface Course {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  schedule: {
    day: string;
    start_time: string;
    end_time: string;
  }[];
  created_at: string;
  updated_at: string;
}

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isTeacher } = useUser();

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    try {
      let query = supabase
        .from("courses")
        .select(`
          *,
          teacher:profiles!teacher_id(full_name, email),
          enrollments:course_enrollments(user_id)
        `);

      if (isTeacher) {
        query = query.eq("teacher_id", user?.id);
      } else {
        query = query.eq("course_enrollments.user_id", user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async (courseData: Omit<Course, "id" | "created_at" | "updated_at">) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("courses")
        .insert({
          ...courseData,
          teacher_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setCourses((prev) => [...prev, data]);
      return { data, error: null };
    } catch (error) {
      console.error("Error creating course:", error);
      return { data: null, error };
    }
  };

  const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", courseId)
        .eq("teacher_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setCourses((prev) =>
        prev.map((course) => (course.id === courseId ? data : course))
      );
      return { data, error: null };
    } catch (error) {
      console.error("Error updating course:", error);
      return { data: null, error };
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId)
        .eq("teacher_id", user.id);

      if (error) throw error;

      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      return { error: null };
    } catch (error) {
      console.error("Error deleting course:", error);
      return { error };
    }
  };

  const enrollStudent = async (courseId: string, studentId: string) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const { error } = await supabase.from("course_enrollments").insert({
        course_id: courseId,
        user_id: studentId,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error enrolling student:", error);
      return { error };
    }
  };

  const unenrollStudent = async (courseId: string, studentId: string) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const { error } = await supabase
        .from("course_enrollments")
        .delete()
        .eq("course_id", courseId)
        .eq("user_id", studentId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error unenrolling student:", error);
      return { error };
    }
  };

  return {
    courses,
    loading,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollStudent,
    unenrollStudent,
    refresh: loadCourses,
  };
}
