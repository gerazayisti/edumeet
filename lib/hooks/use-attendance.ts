import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/api";
import { useUser } from "./use-user";

export interface Attendance {
  id: string;
  meeting_id: string;
  user_id: string;
  status: "present" | "late" | "excused" | "absent";
  check_in_time: string | null;
  check_out_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceStats {
  total_meetings: number;
  present_count: number;
  late_count: number;
  excused_count: number;
  absent_count: number;
  attendance_rate: number;
  trend: {
    date: string;
    status: Attendance["status"];
  }[];
}

export function useAttendance(courseId?: string) {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isTeacher } = useUser();

  useEffect(() => {
    if (user) {
      loadAttendance();
      if (!isTeacher) {
        loadStats();
      }
    }
  }, [user, courseId]);

  const loadAttendance = async () => {
    try {
      let query = supabase
        .from("attendance")
        .select(`
          *,
          meeting:meetings(title, start_time, end_time),
          student:profiles!user_id(full_name, email)
        `);

      if (courseId) {
        query = query.eq("meetings.course_id", courseId);
      }
      if (!isTeacher) {
        query = query.eq("user_id", user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setAttendance(data || []);
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc("calculate_attendance_stats", {
        p_user_id: user?.id,
        p_course_id: courseId,
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error("Error loading attendance stats:", error);
    }
  };

  const markAttendance = async (
    meetingId: string,
    studentId: string,
    status: Attendance["status"],
    notes?: string
  ) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const attendance = {
        meeting_id: meetingId,
        user_id: studentId,
        status,
        notes,
        check_in_time: status === "present" ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from("attendance")
        .upsert(attendance)
        .select()
        .single();

      if (error) throw error;

      setAttendance((prev) => [
        ...prev.filter(
          (a) => a.meeting_id !== meetingId || a.user_id !== studentId
        ),
        data,
      ]);

      return { data, error: null };
    } catch (error) {
      console.error("Error marking attendance:", error);
      return { data: null, error };
    }
  };

  const markCheckOut = async (attendanceId: string) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("attendance")
        .update({ check_out_time: new Date().toISOString() })
        .eq("id", attendanceId)
        .select()
        .single();

      if (error) throw error;

      setAttendance((prev) =>
        prev.map((a) => (a.id === attendanceId ? data : a))
      );

      return { data, error: null };
    } catch (error) {
      console.error("Error marking check-out:", error);
      return { data: null, error };
    }
  };

  const generateAttendanceReport = async (studentId: string) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const { data, error } = await supabase.rpc(
        "generate_attendance_report",
        {
          p_student_id: studentId,
          p_course_id: courseId,
        }
      );

      if (error) throw error;

      return {
        data: {
          ...data,
          trend: attendance
            .filter((a) => a.user_id === studentId)
            .sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            )
            .map((a) => ({
              date: a.created_at,
              status: a.status,
            })),
        },
        error: null,
      };
    } catch (error) {
      console.error("Error generating attendance report:", error);
      return { data: null, error };
    }
  };

  return {
    attendance,
    stats,
    loading,
    markAttendance,
    markCheckOut,
    generateAttendanceReport,
    refresh: loadAttendance,
  };
}
