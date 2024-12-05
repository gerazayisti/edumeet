"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"

const messages = [
  {
    id: 1,
    sender: {
      name: "Alice Johnson",
      avatar: "AJ",
    },
    message: "Can you explain that last concept again?",
    time: "2:45 PM",
  },
  {
    id: 2,
    sender: {
      name: "Prof. Smith",
      avatar: "PS",
    },
    message: "Of course! Let me share my screen and go through it.",
    time: "2:46 PM",
  },
]

export function MeetingChat() {
  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`/avatars/${message.id}.png`} />
                <AvatarFallback>{message.sender.avatar}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {message.sender.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {message.time}
                  </span>
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <form className="flex gap-2">
          <Input
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}