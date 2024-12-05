"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/lib/hooks/use-user"
import { supabase } from "@/lib/supabase/client"
import { CalendarDays, BookOpen, ClipboardList, Trophy } from "lucide-react"

interface CourseProgress {
  courseId: string
  courseName: string
  progress: number
  totalAssignments: number
  completedAssignments: number
}

export function StudentDashboard() {
  const { user } = useUser()
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedAssignments: 0,
    upcomingAssignments: 0,
    achievements: 0,
  })

  useEffect(() => {
    async function fetchStudentData() {
      if (!user) return

      try {
        // Fetch enrolled courses
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select(`
            course_id,
            courses (
              title,
              assignments (
                id,
                completed
              )
            )
          `)
          .eq('student_id', user.id)

        if (enrollments) {
          const progress = enrollments.map((enrollment) => {
            const course = enrollment.courses
            const assignments = course.assignments || []
            const completed = assignments.filter((a: any) => a.completed).length
            
            return {
              courseId: enrollment.course_id,
              courseName: course.title,
              progress: assignments.length ? (completed / assignments.length) * 100 : 0,
              totalAssignments: assignments.length,
              completedAssignments: completed,
            }
          })

          setCourseProgress(progress)

          // Calculate stats
          setStats({
            totalCourses: enrollments.length,
            completedAssignments: progress.reduce((acc, curr) => acc + curr.completedAssignments, 0),
            upcomingAssignments: progress.reduce((acc, curr) => acc + (curr.totalAssignments - curr.completedAssignments), 0),
            achievements: 0, // TODO: Implement achievements system
          })
        }
      } catch (error) {
        console.error('Error fetching student data:', error)
      }
    }

    fetchStudentData()
  }, [user])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-muted-foreground">
          Here's an overview of your learning progress
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Courses
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
              Completed Assignments
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedAssignments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Tasks
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAssignments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Achievements
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.achievements}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
            <CardDescription>
              Your progress across all enrolled courses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {courseProgress.map((course) => (
              <div key={course.courseId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {course.courseName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {course.completedAssignments} of {course.totalAssignments} assignments completed
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(course.progress)}%
                  </span>
                </div>
                <Progress value={course.progress} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
