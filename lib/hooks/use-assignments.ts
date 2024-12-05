import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/api";
import { useUser } from "./use-user";

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  due_date: string;
  points_possible: number;
  rubric: {
    criteria: {
      id: string;
      title: string;
      description: string;
      points: number;
    }[];
  };
  attachments: string[];
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  content: string;
  file_urls: string[];
  score: number | null;
  feedback: string | null;
  rubric_scores: Record<string, number>;
  submitted_at: string;
  graded_at: string | null;
}

export function useAssignments(courseId?: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isTeacher } = useUser();

  useEffect(() => {
    if (user) {
      loadAssignments();
      if (!isTeacher) {
        loadSubmissions();
      }
    }
  }, [user, courseId]);

  const loadAssignments = async () => {
    try {
      let query = supabase.from("assignments").select("*");

      if (courseId) {
        query = query.eq("course_id", courseId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      let query = supabase
        .from("assignment_submissions")
        .select("*")
        .eq("user_id", user?.id);

      if (courseId) {
        query = query.eq("assignments.course_id", courseId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error("Error loading submissions:", error);
    }
  };

  const createAssignment = async (
    assignmentData: Omit<Assignment, "id" | "created_at" | "updated_at">
  ) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("assignments")
        .insert(assignmentData)
        .select()
        .single();

      if (error) throw error;

      setAssignments((prev) => [...prev, data]);
      return { data, error: null };
    } catch (error) {
      console.error("Error creating assignment:", error);
      return { data: null, error };
    }
  };

  const updateAssignment = async (
    assignmentId: string,
    updates: Partial<Assignment>
  ) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("assignments")
        .update(updates)
        .eq("id", assignmentId)
        .select()
        .single();

      if (error) throw error;

      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === assignmentId ? data : assignment
        )
      );
      return { data, error: null };
    } catch (error) {
      console.error("Error updating assignment:", error);
      return { data: null, error };
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      setAssignments((prev) =>
        prev.filter((assignment) => assignment.id !== assignmentId)
      );
      return { error: null };
    } catch (error) {
      console.error("Error deleting assignment:", error);
      return { error };
    }
  };

  const submitAssignment = async (
    assignmentId: string,
    submission: Pick<AssignmentSubmission, "content" | "file_urls">
  ) => {
    try {
      if (!user) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("assignment_submissions")
        .insert({
          assignment_id: assignmentId,
          user_id: user.id,
          ...submission,
        })
        .select()
        .single();

      if (error) throw error;

      setSubmissions((prev) => [...prev, data]);
      return { data, error: null };
    } catch (error) {
      console.error("Error submitting assignment:", error);
      return { data: null, error };
    }
  };

  const gradeSubmission = async (
    submissionId: string,
    grading: Pick<AssignmentSubmission, "score" | "feedback" | "rubric_scores">
  ) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("assignment_submissions")
        .update({
          ...grading,
          graded_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select()
        .single();

      if (error) throw error;

      setSubmissions((prev) =>
        prev.map((submission) =>
          submission.id === submissionId ? data : submission
        )
      );
      return { data, error: null };
    } catch (error) {
      console.error("Error grading submission:", error);
      return { data: null, error };
    }
  };

  return {
    assignments,
    submissions,
    loading,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    gradeSubmission,
    refresh: loadAssignments,
  };
}
