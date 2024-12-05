import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  courses: string[];
  status: "active" | "inactive";
  joinDate: string;
}

export function StudentList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [students] = useState<Student[]>([
    {
      id: "1",
      name: "John Smith",
      email: "john@example.com",
      courses: ["Mathematics", "Physics"],
      status: "active",
      joinDate: "2024-01-10",
    },
    {
      id: "2",
      name: "Jane Doe",
      email: "jane@example.com",
      courses: ["Chemistry", "Biology"],
      status: "active",
      joinDate: "2024-01-12",
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@example.com",
      courses: ["Physics"],
      status: "inactive",
      joinDate: "2023-12-15",
    },
  ]);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-medium">All Students</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {student.courses.map((course) => (
                      <Badge key={course} variant="secondary">
                        {course}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={student.status === "active" ? "default" : "secondary"}
                  >
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell>{student.joinDate}</TableCell>
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
  );
}
