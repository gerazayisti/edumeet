"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus } from "lucide-react"

const assignments = [
  {
    id: 1,
    title: "Linear Equations Problem Set",
    dueDate: "2024-02-25",
    status: "active",
    submissions: 18,
    totalPoints: 100,
  },
  {
    id: 2,
    title: "Geometry Proofs Assignment",
    dueDate: "2024-02-28",
    status: "upcoming",
    submissions: 0,
    totalPoints: 50,
  },
  {
    id: 3,
    title: "Algebra Quiz #1",
    dueDate: "2024-02-18",
    status: "completed",
    submissions: 30,
    totalPoints: 75,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
    case "upcoming":
      return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
    case "completed":
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
  }
}

export function CourseAssignments() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Assignments</CardTitle>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Assignment
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assignment</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  {assignment.title}
                </TableCell>
                <TableCell>{assignment.dueDate}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={getStatusColor(assignment.status)}
                  >
                    {assignment.status}
                  </Badge>
                </TableCell>
                <TableCell>{assignment.submissions}</TableCell>
                <TableCell>{assignment.totalPoints}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}