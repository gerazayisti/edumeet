import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Assignments API
export const assignmentsApi = {
  async create(data: any) {
    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return assignment;
  },

  async getAll() {
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        course:courses(*),
        submissions:assignment_submissions(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return assignments;
  },

  async submit(assignmentId: string, data: any) {
    const { data: submission, error } = await supabase
      .from('assignment_submissions')
      .insert({
        assignment_id: assignmentId,
        ...data,
      })
      .select()
      .single();

    if (error) throw error;
    return submission;
  },

  async grade(submissionId: string, data: any) {
    const { data: submission, error } = await supabase
      .from('assignment_submissions')
      .update({
        score: data.score,
        feedback: data.feedback,
        status: 'graded',
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return submission;
  },
};

// Meetings API
export const meetingsApi = {
  async create(data: any) {
    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return meeting;
  },

  async getAll() {
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select(`
        *,
        course:courses(*),
        host:profiles(*),
        participants:meeting_participants(*)
      `)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return meetings;
  },

  async join(meetingId: string, userId: string) {
    const { data: participant, error } = await supabase
      .from('meeting_participants')
      .upsert({
        meeting_id: meetingId,
        user_id: userId,
        status: 'attended',
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return participant;
  },
};

// Notifications API
export const notificationsApi = {
  async create(data: any) {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return notification;
  },

  async getAll(userId: string) {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return notifications;
  },

  async markAsRead(notificationId: string) {
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return notification;
  },

  async subscribe(userId: string, callback: (notification: any) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
  },
};

// WebRTC Signaling API
export const signalingApi = {
  async createRoom(roomId: string, hostId: string) {
    const { data: room, error } = await supabase
      .from('meetings')
      .insert({
        room_id: roomId,
        host_id: hostId,
        status: 'in_progress',
      })
      .select()
      .single();

    if (error) throw error;
    return room;
  },

  async joinRoom(roomId: string, userId: string) {
    const channel = supabase.channel(`room:${roomId}`);

    channel
      .on('broadcast', { event: 'offer' }, ({ payload }) => {
        // Handle incoming offer
      })
      .on('broadcast', { event: 'answer' }, ({ payload }) => {
        // Handle incoming answer
      })
      .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
        // Handle incoming ICE candidate
      })
      .subscribe();

    return channel;
  },

  async sendSignal(channel: any, event: string, payload: any) {
    return channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  },
};
