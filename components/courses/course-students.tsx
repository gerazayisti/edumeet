import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Plus } from "lucide-react"

const students = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    progress: 75,
    avatar: "AJ",
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    progress: 60,
    avatar: "BS",
  },
  {
    id: 3,
    name: "Carol Williams",
    email: "carol@example.com",
    progress: 90,
    avatar: "CW",
  },
]

export function CourseStudents() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Enrolled Students</CardTitle>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`/avatars/${student.id}.png`} />
                    <AvatarFallback>{student.avatar}</AvatarFallback>
                  </Avatar>
                  {student.name}
                </TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.progress}%</TableCell>
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