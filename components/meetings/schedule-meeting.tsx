"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useUser } from "@/lib/hooks/use-user"
import { useToast } from "@/hooks/use-toast"

interface ScheduleMeetingProps {
  onClose: () => void
  onSuccess: () => void
}

export function ScheduleMeeting({ onClose, onSuccess }: ScheduleMeetingProps) {
  const { user, profile } = useUser()
  const { toast } = useToast()
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [meetingData, setMeetingData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "60",
    course_id: "",
    type: "class" as const,
    participants: "",
    is_recurring: false,
    recurring_pattern: null as string | null
  })
  const [generatedMeeting, setGeneratedMeeting] = useState<{
    id: string
    meeting_code: string
    meeting_link: string
  } | null>(null)

  useEffect(() => {
    if (!user) return
    fetchCourses()
  }, [user])

  async function fetchCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('instructor_id', user?.id)
        .eq('status', 'active')

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive"
      })
    }
  }

  function generateMeetingCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  function generateMeetingLink(meetingCode: string) {
    return `${window.location.origin}/meet/${meetingCode}`
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setMeetingData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setMeetingData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCopyLink = async () => {
    if (!generatedMeeting) return
    await navigator.clipboard.writeText(generatedMeeting.meeting_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Validate inputs
      if (!meetingData.title || !meetingData.date || !meetingData.time) {
        throw new Error("Please fill in all required fields")
      }

      // Create meeting object
      const startTime = new Date(`${meetingData.date}T${meetingData.time}`)
      const endTime = new Date(startTime.getTime() + parseInt(meetingData.duration) * 60000)
      const meetingCode = generateMeetingCode()
      const meetingLink = generateMeetingLink(meetingCode)

      // Insert meeting into database
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          title: meetingData.title,
          description: meetingData.description,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          host_id: user.id,
          course_id: meetingData.course_id || null,
          meeting_code: meetingCode,
          meeting_link: meetingLink,
          type: meetingData.type,
          status: 'scheduled',
          is_recurring: meetingData.is_recurring,
          recurring_pattern: meetingData.recurring_pattern
        })
        .select()
        .single()

      if (meetingError) throw meetingError

      // Add participants if specified
      if (meetingData.participants) {
        const participants = meetingData.participants
          .split(',')
          .map(email => email.trim())
          .filter(email => email)

        if (participants.length > 0) {
          // Get user IDs from emails
          const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id')
            .in('email', participants)

          if (usersError) throw usersError

          if (users && users.length > 0) {
            // Insert participants
            const { error: participantsError } = await supabase
              .from('meeting_participants')
              .insert(
                users.map(user => ({
                  meeting_id: meeting.id,
                  user_id: user.id,
                  status: 'invited'
                }))
              )

            if (participantsError) throw participantsError

            // Send email invitations
            await fetch('/api/meetings/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: participants,
                subject: `Meeting Invitation: ${meetingData.title}`,
                html: `
                  <h2>Meeting Invitation</h2>
                  <p>You have been invited to a meeting:</p>
                  <p><strong>Title:</strong> ${meetingData.title}</p>
                  <p><strong>Description:</strong> ${meetingData.description}</p>
                  <p><strong>Date:</strong> ${meetingData.date}</p>
                  <p><strong>Time:</strong> ${meetingData.time}</p>
                  <p><strong>Duration:</strong> ${meetingData.duration} minutes</p>
                  <p><strong>Meeting Link:</strong> ${meetingLink}</p>
                  <p><strong>Meeting Code:</strong> ${meetingCode}</p>
                `
              })
            })
          }
        }
      }

      setGeneratedMeeting({
        id: meeting.id,
        meeting_code: meetingCode,
        meeting_link: meetingLink
      })

      toast({
        title: "Success",
        description: "Meeting scheduled successfully"
      })

      onSuccess()
    } catch (error) {
      console.error('Error creating meeting:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule meeting",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>
            Create a new meeting and invite participants
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Meeting title"
              value={meetingData.title}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Meeting description"
              value={meetingData.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={meetingData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={meetingData.time}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              min="15"
              max="480"
              value={meetingData.duration}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course">Course (Optional)</Label>
            <Select
              name="course_id"
              value={meetingData.course_id || "none"}
              onValueChange={(value) => handleSelectChange("course_id", value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Meeting Type</Label>
            <Select
              name="type"
              value={meetingData.type}
              onValueChange={(value) => handleSelectChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="class">Class</SelectItem>
                <SelectItem value="office_hours">Office Hours</SelectItem>
                <SelectItem value="group_study">Group Study</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="participants">
              Participants (comma-separated emails)
            </Label>
            <Textarea
              id="participants"
              name="participants"
              placeholder="participant1@email.com, participant2@email.com"
              value={meetingData.participants}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </div>
        </form>
        {generatedMeeting && (
          <div className="mt-4 p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Meeting Link</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground break-all">
              {generatedMeeting.meeting_link}
            </p>
            <div className="text-sm">
              <span className="font-medium">Meeting Code: </span>
              {generatedMeeting.meeting_code}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}