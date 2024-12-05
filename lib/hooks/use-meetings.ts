import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/api";
import { useUser } from "./use-user";

export interface Meeting {
  id: string;
  course_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  type: "class" | "office_hours" | "group_study";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  host_id: string;
  recording_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  meeting_id: string;
  user_id: string;
  role: "host" | "participant";
  joined_at: string | null;
  left_at: string | null;
}

export interface MeetingReaction {
  id: string;
  meeting_id: string;
  user_id: string;
  type: "hand" | "like" | "heart" | "clap" | "smile";
  created_at: string;
}

export function useMeetings(courseId?: string) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [participants, setParticipants] = useState<Record<string, MeetingParticipant[]>>({});
  const [reactions, setReactions] = useState<Record<string, MeetingReaction[]>>({});
  const [loading, setLoading] = useState(true);
  const { user, isTeacher } = useUser();

  useEffect(() => {
    if (user) {
      loadMeetings();
    }
  }, [user, courseId]);

  useEffect(() => {
    if (meetings.length > 0) {
      const channel = supabase
        .channel("meeting-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "meeting_participants",
          },
          (payload) => {
            handleParticipantUpdate(payload.new as MeetingParticipant);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "meeting_reactions",
          },
          (payload) => {
            handleReactionUpdate(payload.new as MeetingReaction);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [meetings]);

  const loadMeetings = async () => {
    try {
      let query = supabase
        .from("meetings")
        .select(`
          *,
          host:profiles!host_id(full_name, email),
          participants:meeting_participants(*)
        `);

      if (courseId) {
        query = query.eq("course_id", courseId);
      }

      if (!isTeacher) {
        query = query.eq("meeting_participants.user_id", user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMeetings(data || []);

      // Load participants and reactions for each meeting
      data?.forEach((meeting) => {
        loadParticipants(meeting.id);
        loadReactions(meeting.id);
      });
    } catch (error) {
      console.error("Error loading meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async (meetingId: string) => {
    try {
      const { data, error } = await supabase
        .from("meeting_participants")
        .select("*, user:profiles(full_name, email)")
        .eq("meeting_id", meetingId);

      if (error) throw error;
      setParticipants((prev) => ({ ...prev, [meetingId]: data }));
    } catch (error) {
      console.error("Error loading participants:", error);
    }
  };

  const loadReactions = async (meetingId: string) => {
    try {
      const { data, error } = await supabase
        .from("meeting_reactions")
        .select("*, user:profiles(full_name)")
        .eq("meeting_id", meetingId);

      if (error) throw error;
      setReactions((prev) => ({ ...prev, [meetingId]: data }));
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  };

  const createMeeting = async (meetingData: Omit<Meeting, "id" | "created_at" | "updated_at">) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("meetings")
        .insert({
          ...meetingData,
          host_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setMeetings((prev) => [...prev, data]);
      return { data, error: null };
    } catch (error) {
      console.error("Error creating meeting:", error);
      return { data: null, error };
    }
  };

  const updateMeeting = async (meetingId: string, updates: Partial<Meeting>) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("meetings")
        .update(updates)
        .eq("id", meetingId)
        .eq("host_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setMeetings((prev) =>
        prev.map((meeting) => (meeting.id === meetingId ? data : meeting))
      );
      return { data, error: null };
    } catch (error) {
      console.error("Error updating meeting:", error);
      return { data: null, error };
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    try {
      if (!user || !isTeacher) throw new Error("Unauthorized");

      const { error } = await supabase
        .from("meetings")
        .delete()
        .eq("id", meetingId)
        .eq("host_id", user.id);

      if (error) throw error;

      setMeetings((prev) => prev.filter((meeting) => meeting.id !== meetingId));
      return { error: null };
    } catch (error) {
      console.error("Error deleting meeting:", error);
      return { error };
    }
  };

  const joinMeeting = async (meetingId: string) => {
    try {
      if (!user) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("meeting_participants")
        .upsert(
          {
            meeting_id: meetingId,
            user_id: user.id,
            role: "participant",
            joined_at: new Date().toISOString(),
            left_at: null,
          },
          { onConflict: "meeting_id,user_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error joining meeting:", error);
      return { data: null, error };
    }
  };

  const leaveMeeting = async (meetingId: string) => {
    try {
      if (!user) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("meeting_participants")
        .update({
          left_at: new Date().toISOString(),
        })
        .eq("meeting_id", meetingId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error leaving meeting:", error);
      return { data: null, error };
    }
  };

  const sendReaction = async (meetingId: string, type: MeetingReaction["type"]) => {
    try {
      if (!user) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("meeting_reactions")
        .insert({
          meeting_id: meetingId,
          user_id: user.id,
          type,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error sending reaction:", error);
      return { data: null, error };
    }
  };

  const handleParticipantUpdate = (participant: MeetingParticipant) => {
    setParticipants((prev) => ({
      ...prev,
      [participant.meeting_id]: [
        ...(prev[participant.meeting_id] || []).filter(
          (p) => p.user_id !== participant.user_id
        ),
        participant,
      ],
    }));
  };

  const handleReactionUpdate = (reaction: MeetingReaction) => {
    setReactions((prev) => ({
      ...prev,
      [reaction.meeting_id]: [...(prev[reaction.meeting_id] || []), reaction],
    }));
  };

  return {
    meetings,
    participants,
    reactions,
    loading,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    joinMeeting,
    leaveMeeting,
    sendReaction,
    refresh: loadMeetings,
  };
}
