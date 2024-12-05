import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Calendar, Plus, Video } from "lucide-react"

const meetings = [
  {
    id: 1,
    title: "Introduction to Algebra",
    date: "2024-02-20",
    time: "14:00",
    status: "upcoming",
  },
  {
    id: 2,
    title: "Geometry Fundamentals",
    date: "2024-02-22",
    time: "14:00",
    status: "upcoming",
  },
  {
    id: 3,
    title: "Basic Calculus Concepts",
    date: "2024-02-19",
    time: "14:00",
    status: "completed",
  },
]

export function CourseMeetings() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Course Meetings</CardTitle>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Meeting
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Video className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{meeting.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {meeting.date} at {meeting.time}
                  </div>
                </div>
              </div>
              <Button variant={meeting.status === "upcoming" ? "default" : "secondary"}>
                {meeting.status === "upcoming" ? "Join Meeting" : "View Recording"}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}