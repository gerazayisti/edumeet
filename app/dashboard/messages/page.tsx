"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks/use-user";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Search, Send, User2 } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface ChatUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  last_seen: string | null;
  role: string;
}

export default function MessagesPage() {
  const { user, profile } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch chat users
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, last_seen, role")
          .neq("id", user.id);

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (selectedUser?.id === newMessage.sender_id) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
    };
  }, [user, selectedUser, toast]);

  useEffect(() => {
    if (!user || !selectedUser) return;

    // Fetch messages with selected user
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);

        // Mark messages as read
        if (data) {
          const unreadMessages = data.filter(
            (m) => !m.read && m.sender_id === selectedUser.id
          );
          if (unreadMessages.length > 0) {
            await supabase
              .from("messages")
              .update({ read: true })
              .in(
                "id",
                unreadMessages.map((m) => m.id)
              );
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchMessages();
  }, [user, selectedUser, toast]);

  const handleSendMessage = async () => {
    if (!user || !selectedUser || !message.trim()) return;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: selectedUser.id,
        content: message.trim(),
        created_at: new Date().toISOString(),
        read: false,
      });

      if (error) throw error;

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((u) =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user || !profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-4">
      {/* Users List */}
      <Card className="w-80">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-4">
              {filteredUsers.map((chatUser) => (
                <div key={chatUser.id}>
                  <button
                    onClick={() => setSelectedUser(chatUser)}
                    className={`w-full flex items-center space-x-4 p-2 rounded-lg transition-colors ${
                      selectedUser?.id === chatUser.id
                        ? "bg-secondary"
                        : "hover:bg-secondary/50"
                    }`}
                  >
                    <Avatar>
                      <AvatarImage src={chatUser.avatar_url || undefined} />
                      <AvatarFallback>
                        <User2 className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{chatUser.full_name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {chatUser.role}
                      </p>
                    </div>
                  </button>
                  <Separator className="my-2" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1">
        <CardContent className="p-4 h-full flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center space-x-4 pb-4">
                <Avatar>
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback>
                    <User2 className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.full_name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedUser.role}
                  </p>
                </div>
              </div>
              <Separator className="mb-4" />

              {/* Messages */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {format(new Date(msg.created_at), "p")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="flex items-center space-x-2 mt-4">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <User2 className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  Select a user to start chatting
                </h3>
                <p className="text-muted-foreground">
                  Choose from your list of contacts on the left
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
