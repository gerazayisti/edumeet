import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/api";
import { useUser } from "./use-user";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments?: string[];
  read_by: string[];
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  type: "direct" | "group";
  participants: {
    user_id: string;
    role: "admin" | "member";
    joined_at: string;
  }[];
  last_message?: Message;
  created_at: string;
  updated_at: string;
}

export function useMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      loadConversations();
      subscribeToMessages();
    }
  }, [user]);

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const message = payload.new as Message;
          handleNewMessage(message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleNewMessage = (message: Message) => {
    // Update messages for the conversation
    setMessages((prev) => ({
      ...prev,
      [message.conversation_id]: [
        ...(prev[message.conversation_id] || []),
        message,
      ],
    }));

    // Update unread count if message is not from current user
    if (message.sender_id !== user?.id) {
      setUnreadCounts((prev) => ({
        ...prev,
        [message.conversation_id]: (prev[message.conversation_id] || 0) + 1,
      }));
    }

    // Update last message in conversation
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === message.conversation_id
          ? { ...conv, last_message: message }
          : conv
      )
    );
  };

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          participants!inner(*),
          last_message:messages(*)
        `)
        .eq("participants.user_id", user?.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      setConversations(data || []);
      
      // Load messages and unread counts for each conversation
      data?.forEach((conversation) => {
        loadMessages(conversation.id);
        loadUnreadCount(conversation.id);
      });
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages((prev) => ({
        ...prev,
        [conversationId]: data || [],
      }));
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadUnreadCount = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id", { count: "exact" })
        .eq("conversation_id", conversationId)
        .not("read_by", "cs", `{${user?.id}}`)
        .neq("sender_id", user?.id);

      if (error) throw error;

      setUnreadCounts((prev) => ({
        ...prev,
        [conversationId]: data.length,
      }));
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const createConversation = async (
    title: string,
    type: Conversation["type"],
    participantIds: string[]
  ) => {
    try {
      if (!user) throw new Error("Unauthorized");

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({ title, type })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participants = [
        { user_id: user.id, role: "admin" as const },
        ...participantIds.map((id) => ({
          user_id: id,
          role: "member" as const,
        })),
      ];

      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert(
          participants.map((p) => ({
            conversation_id: conversation.id,
            ...p,
          }))
        );

      if (partError) throw partError;

      setConversations((prev) => [
        { ...conversation, participants },
        ...prev,
      ]);

      return { data: conversation, error: null };
    } catch (error) {
      console.error("Error creating conversation:", error);
      return { data: null, error };
    }
  };

  const sendMessage = async (
    conversationId: string,
    content: string,
    attachments?: string[]
  ) => {
    try {
      if (!user) throw new Error("Unauthorized");

      const message = {
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        attachments,
        read_by: [user.id],
      };

      const { data, error } = await supabase
        .from("messages")
        .insert(message)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error sending message:", error);
      return { data: null, error };
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      if (!user) throw new Error("Unauthorized");

      const { error } = await supabase.rpc("mark_conversation_as_read", {
        p_conversation_id: conversationId,
        p_user_id: user.id,
      });

      if (error) throw error;

      setUnreadCounts((prev) => ({
        ...prev,
        [conversationId]: 0,
      }));
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  return {
    conversations,
    messages,
    unreadCounts,
    loading,
    createConversation,
    sendMessage,
    markAsRead,
    refresh: loadConversations,
  };
}
