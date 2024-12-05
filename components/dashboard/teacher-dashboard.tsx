"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from "@/lib/hooks/use-user"
import { supabase } from "@/lib/supabase/client"
import { Users, BookOpen, GraduationCap, LineChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface CourseStats {
  totalStudents: number
  totalCourses: number
  activeAssignments: number
  averageProgress: number
}

interface RecentSubmission {
  id: string
  studentName: string
  courseName: string
  assignmentName: string
  submittedAt: string
}

export function TeacherDashboard() {
  const { user } = useUser()
  const [stats, setStats] = useState<CourseStats>({
    totalStudents: 0,
    totalCourses: 0,
    activeAssignments: 0,
    averageProgress: 0,
  })
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([])

  useEffect(() => {
    async function fetchTeacherData() {
      if (!user) return

      try {
        // Fetch courses created by the teacher
        const { data: courses } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            course_enrollments (
              student_id,
              profiles (
                full_name
              )
            ),
            assignments (
              id,
              title,
              assignment_submissions (
                id,
                created_at,
                profiles (
                  full_name
                )
              )
            )
          `)
          .eq('teacher_id', user.id)

        if (courses) {
          // Calculate stats
          const totalStudents = new Set(courses.flatMap(course => 
            course.course_enrollments.map(enrollment => enrollment.student_id)
          )).size

          const totalAssignments = courses.reduce((acc, course) => 
            acc + (course.assignments?.length || 0), 0
          )

          setStats({
            totalStudents,
            totalCourses: courses.length,
            activeAssignments: totalAssignments,
            averageProgress: 0, // TODO: Implement progress tracking
          })

          // Process recent submissions
          const submissions = courses.flatMap(course => 
            course.assignments?.flatMap(assignment =>
              assignment.assignment_submissions?.map(submission => ({
                id: submission.id,
                studentName: submission.profiles.full_name,
                courseName: course.title,
                assignmentName: assignment.title,
                submittedAt: submission.created_at,
              })) || []
            ) || []
          )

          // Sort by submission date and take the 5 most recent
          setRecentSubmissions(
            submissions
              .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
              .slice(0, 5)
          )
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error)
      }
    }

    fetchTeacherData()
  }, [user])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your courses and track student progress
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/courses/new">Create New Course</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Assignments
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAssignments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Progress
            </CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageProgress}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>
            Latest assignment submissions from your students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{submission.studentName}</TableCell>
                  <TableCell>{submission.courseName}</TableCell>
                  <TableCell>{submission.assignmentName}</TableCell>
                  <TableCell>{new Date(submission.submittedAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
