"use client"

import { Button } from "@/components/ui/button"
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Settings,
  Users,
} from "lucide-react"
import { useState } from "react"

export function VideoControls() {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  return (
    <div className="flex items-center justify-center gap-4 rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
      <Button
        variant={isMuted ? "destructive" : "secondary"}
        size="icon"
        onClick={() => setIsMuted(!isMuted)}
      >
        {isMuted ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      <Button
        variant={isVideoOff ? "destructive" : "secondary"}
        size="icon"
        onClick={() => setIsVideoOff(!isVideoOff)}
      >
        {isVideoOff ? (
          <CameraOff className="h-4 w-4" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>

      <Button variant="secondary" size="icon">
        <MonitorUp className="h-4 w-4" />
      </Button>

      <Button variant="secondary" size="icon">
        <Users className="h-4 w-4" />
      </Button>

      <Button variant="secondary" size="icon">
        <Settings className="h-4 w-4" />
      </Button>

      <Button variant="destructive" size="icon">
        <PhoneOff className="h-4 w-4" />
      </Button>
    </div>
  )
}