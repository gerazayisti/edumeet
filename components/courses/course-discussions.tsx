"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Plus } from "lucide-react"

const discussions = [
  {
    id: 1,
    author: {
      name: "Alice Johnson",
      avatar: "AJ",
      role: "Student",
    },
    content: "Can someone explain the concept of limits in calculus?",
    timestamp: "2 hours ago",
    replies: 3,
  },
  {
    id: 2,
    author: {
      name: "Prof. Smith",
      avatar: "PS",
      role: "Teacher",
    },
    content: "Here are some additional resources for today's lecture on differential equations.",
    timestamp: "1 day ago",
    replies: 5,
  },
  {
    id: 3,
    author: {
      name: "Bob Wilson",
      avatar: "BW",
      role: "Student",
    },
    content: "I'm having trouble with the homework problem #5. Any hints?",
    timestamp: "3 days ago",
    replies: 8,
  },
]

export function CourseDiscussions() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Start a new discussion..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button>
                <MessageSquare className="mr-2 h-4 w-4" />
                Post Discussion
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {discussions.map((discussion) => (
          <Card key={discussion.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={`/avatars/${discussion.id}.png`} />
                  <AvatarFallback>{discussion.author.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{discussion.author.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {discussion.author.role} • {discussion.timestamp}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      {discussion.replies} replies
                    </Button>
                  </div>
                  <p className="text-sm">{discussion.content}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      Reply
                    </Button>
                    <Button variant="ghost" size="sm">
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}