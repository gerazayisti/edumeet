"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VideoControls } from "@/components/meetings/video-controls"
import { ParticipantsList } from "@/components/meetings/participants-list"
import { MeetingChat } from "@/components/meetings/meeting-chat"
import { Camera, Mic, MonitorUp, Users } from "lucide-react"

export default function MeetingRoom({ params }: { params: { id: string } }) {
  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4 p-4">
      <div className="flex flex-1 flex-col gap-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-4">
            <Button variant="secondary" size="icon">
              <Mic className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon">
              <Camera className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon">
              <MonitorUp className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon">
              <Users className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <VideoControls />
      </div>

      <Card className="w-80">
        <Tabs defaultValue="participants" className="h-full">
          <TabsList className="w-full">
            <TabsTrigger value="participants" className="flex-1">
              Participants
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex-1">
              Chat
            </TabsTrigger>
          </TabsList>
          <TabsContent value="participants" className="h-[calc(100%-2rem)]">
            <ParticipantsList />
          </TabsContent>
          <TabsContent value="chat" className="h-[calc(100%-2rem)]">
            <MeetingChat />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}