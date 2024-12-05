"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Calendar, Download, Users, Video } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useUser } from "@/lib/hooks/use-user"
import { useToast } from "@/hooks/use-toast"

interface MeetingsListProps {
  recorded?: boolean
}

type Meeting = {
  id: string
  title: string
  description: string
  start_time: string
  end_time?: string
  host_id: string
  course_id?: string
  status: 'scheduled' | 'ongoing' | 'completed'
  host?: {
    name: string
    avatar: string
  }
  participants_count?: number
}

type RecordedMeeting = {
  id: string
  meeting_id: string
  file_url: string
  created_at: string
  duration: number
  meeting?: Meeting
}

export function MeetingsList({ recorded = false }: MeetingsListProps) {
  const { user } = useUser()
  const { toast } = useToast()
  const [meetings, setMeetings] = useState<(Meeting | RecordedMeeting)[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchMeetings() {
      try {
        setLoading(true)
        
        if (!recorded) {
          // Fetch upcoming meetings
          const { data, error } = await supabase
            .from('meetings')
            .select(`
              *,
              meeting_participants(count),
              profiles!inner(full_name, avatar_url)
            `)
            .eq('meeting_participants.user_id', user.id)
            .or(`host_id.eq.${user.id},status.eq.scheduled`)
            .order('start_time', { ascending: true })

          if (error) throw error

          const formattedMeetings = data.map(meeting => ({
            ...meeting,
            host: {
              name: meeting.profiles?.full_name || 'Unknown Host',
              avatar: meeting.profiles?.avatar_url || 'U'
            },
            participants_count: meeting.meeting_participants[0]?.count || 0
          }))

          setMeetings(formattedMeetings)
        } else {
          // Fetch recorded meetings
          const { data, error } = await supabase
            .from('meeting_recordings')
            .select(`
              *,
              meetings(
                title, 
                description, 
                host_id, 
                profiles!inner(full_name, avatar_url)
              )
            `)
            .eq('meetings.host_id', user.id)
            .order('created_at', { ascending: false })

          if (error) throw error

          const formattedRecordings = data.map(recording => ({
            ...recording,
            meeting: {
              ...recording.meetings,
              host: {
                name: recording.meetings.profiles?.full_name || 'Unknown Host',
                avatar: recording.meetings.profiles?.avatar_url || 'U'
              }
            }
          }))

          setMeetings(formattedRecordings)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not load meetings",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMeetings()
  }, [user, recorded])

  const handleJoinMeeting = async (meetingId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('meeting_participants')
        .insert({
          meeting_id: meetingId,
          user_id: user.id
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Joined meeting successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not join meeting",
        variant: "destructive"
      })
    }
  }

  const downloadRecording = async (recordingUrl: string) => {
    try {
      // You might want to use Supabase storage download method here
      const link = document.createElement('a')
      link.href = recordingUrl
      link.download = `meeting_recording_${new Date().toISOString()}.webm`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: "Recording download started"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not download recording",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return <div>Loading meetings...</div>
  }

  if (meetings.length === 0) {
    return <div>No {recorded ? 'recorded' : 'upcoming'} meetings found.</div>
  }

  return (
    <div className="space-y-4">
      {meetings.map((meetingOrRecording) => {
        const meeting = recorded 
          ? (meetingOrRecording as RecordedMeeting).meeting 
          : meetingOrRecording as Meeting

        const isRecorded = recorded

        return (
          <Card key={meetingOrRecording.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>{meeting?.title || 'Untitled Meeting'}</CardTitle>
                  <CardDescription>{meeting?.description || 'No description'}</CardDescription>
                </div>
                <Avatar>
                  <AvatarImage src={meeting?.host?.avatar} />
                  <AvatarFallback>{meeting?.host?.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>
                      {isRecorded 
                        ? new Date((meetingOrRecording as RecordedMeeting).created_at).toLocaleDateString()
                        : new Date((meetingOrRecording as Meeting).start_time).toLocaleString()
                      }
                    </span>
                  </div>
                  {isRecorded && (
                    <div className="flex items-center">
                      <Video className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span>{`${Math.round((meetingOrRecording as RecordedMeeting).duration / 60)} min`}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>{(meeting as Meeting).participants_count || 0} participants</span>
                  </div>
                </div>
                <Button onClick={() => isRecorded 
                  ? downloadRecording((meetingOrRecording as RecordedMeeting).file_url)
                  : handleJoinMeeting(meeting.id)
                }>
                  {isRecorded ? (
                    <>
                      <Download className="mr-2 h-4 w-4" /> Download Recording
                    </>
                  ) : (
                    <>
                      <Video className="mr-2 h-4 w-4" /> Join Meeting
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}