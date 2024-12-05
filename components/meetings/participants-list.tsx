"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Mic, MicOff, Video, VideoOff } from "lucide-react"

const participants = [
  {
    id: 1,
    name: "Prof. Smith",
    role: "Host",
    avatar: "PS",
    isMuted: false,
    isVideoOff: false,
  },
  {
    id: 2,
    name: "Alice Johnson",
    role: "Student",
    avatar: "AJ",
    isMuted: true,
    isVideoOff: false,
  },
  {
    id: 3,
    name: "Bob Wilson",
    role: "Student",
    avatar: "BW",
    isMuted: false,
    isVideoOff: true,
  },
]

export function ParticipantsList() {
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="mb-4">
          <h4 className="text-sm font-medium">Participants (3)</h4>
        </div>
        <div className="space-y-4">
          {participants.map((participant) => (
            <div key={participant.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`/avatars/${participant.id}.png`} />
                    <AvatarFallback>{participant.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {participant.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {participant.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {participant.isMuted ? (
                    <MicOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Mic className="h-4 w-4 text-muted-foreground" />
                  )}
                  {participant.isVideoOff ? (
                    <VideoOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Video className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              <Separator className="mt-4" />
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}