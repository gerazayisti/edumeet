"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/api";
import { useUser } from "./use-user";

export interface CourseProgress {
  id: string;
  course_id: string;
  user_id: string;
  completed_modules: number;
  total_modules: number;
  completed_assignments: number;
  total_assignments: number;
  last_activity: string;
  grade_average: number;
  study_time: number;
}

export interface StudyStats {
  totalStudyTime: number;
  completionRate: number;
  averageGrade: number;
}

export function useProgress() {
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      loadProgress();
      loadStudyStats();
    }
  }, [user]);

  const loadProgress = async () => {
    try {
      const { data, error } = await supabase
        .from("course_progress")
        .select(`
          *,
          course:courses(name)
        `)
        .eq("user_id", user?.id)
        .order("last_activity", { ascending: false });

      if (error) throw error;
      setCourseProgress(data || []);
    } catch (error) {
      console.error("Error loading course progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudyStats = async () => {
    try {
      const { data, error } = await supabase.rpc("calculate_study_stats", {
        p_user_id: user?.id
      });

      if (error) throw error;
      setStudyStats(data);
    } catch (error) {
      console.error("Error loading study stats:", error);
    }
  };

  const updateProgress = async (courseId: string, updates: Partial<CourseProgress>) => {
    try {
      const { data, error } = await supabase
        .from("course_progress")
        .upsert({
          course_id: courseId,
          user_id: user?.id,
          ...updates,
          last_activity: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setCourseProgress(prev => 
        prev.map(p => p.course_id === courseId ? { ...p, ...data } : p)
      );

      await loadStudyStats();
      return { data, error: null };
    } catch (error) {
      console.error("Error updating progress:", error);
      return { data: null, error };
    }
  };

  const logStudyTime = async (courseId: string, minutes: number) => {
    try {
      const { error } = await supabase.rpc("log_study_time", {
        p_course_id: courseId,
        p_user_id: user?.id,
        p_minutes: minutes
      });

      if (error) throw error;

      await Promise.all([loadProgress(), loadStudyStats()]);
      return { error: null };
    } catch (error) {
      console.error("Error logging study time:", error);
      return { error };
    }
  };

  return {
    courseProgress,
    studyStats,
    loading,
    updateProgress,
    logStudyTime,
    refresh: async () => {
      await Promise.all([loadProgress(), loadStudyStats()]);
    }
  };
}
