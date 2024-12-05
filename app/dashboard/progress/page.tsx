"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks/use-user";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { BookOpen, CheckCircle, Clock, Target } from "lucide-react";

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  progress: number;
  completedAssignments: number;
  totalAssignments: number;
  lastActivity: string;
  grades: {
    assignment: string;
    score: number;
    maxScore: number;
    submittedAt: string;
  }[];
  progressHistory: {
    date: string;
    progress: number;
  }[];
}

export default function ProgressPage() {
  const { user, profile } = useUser();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [courses, setCourses] = useState<any[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchCourseProgress = async () => {
      try {
        // Fetch enrolled courses
        const { data: enrolledCourses, error: coursesError } = await supabase
          .from("courses")
          .select(`
            *,
            course_enrollments!inner(*)
          `)
          .eq("course_enrollments.student_id", user.id);

        if (coursesError) throw coursesError;
        setCourses(enrolledCourses || []);

        // Fetch progress for each course
        const progressPromises = enrolledCourses?.map(async (course) => {
          // Get assignments for the course
          const { data: assignments } = await supabase
            .from("assignments")
            .select("*")
            .eq("course_id", course.id);

          // Get completed assignments
          const { data: submissions } = await supabase
            .from("assignment_submissions")
            .select("*, assignments(*)")
            .eq("student_id", user.id)
            .eq("assignments.course_id", course.id);

          // Calculate progress
          const totalAssignments = assignments?.length || 0;
          const completedAssignments = submissions?.length || 0;
          const progress = totalAssignments > 0 
            ? (completedAssignments / totalAssignments) * 100 
            : 0;

          // Get grades
          const grades = submissions?.map((sub) => ({
            assignment: sub.assignments.title,
            score: sub.score || 0,
            maxScore: sub.assignments.max_score,
            submittedAt: sub.submitted_at,
          })) || [];

          // Mock progress history (replace with actual data)
          const progressHistory = Array.from({ length: 10 }, (_, i) => ({
            date: format(new Date(Date.now() - i * 24 * 60 * 60 * 1000), "MMM d"),
            progress: Math.min(progress, Math.random() * 100),
          })).reverse();

          return {
            courseId: course.id,
            courseTitle: course.title,
            progress,
            completedAssignments,
            totalAssignments,
            lastActivity: submissions?.[0]?.submitted_at || course.created_at,
            grades,
            progressHistory,
          };
        });

        const progressData = await Promise.all(progressPromises || []);
        setCourseProgress(progressData);
        
        if (!selectedCourse && progressData.length > 0) {
          setSelectedCourse(progressData[0].courseId);
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseProgress();
  }, [user, selectedCourse]);

  const selectedCourseData = courseProgress.find(
    (course) => course.courseId === selectedCourse
  );

  if (!user || profile?.role !== "student") {
    return <div>Access denied. Students only.</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progress Tracking</h1>
        <p className="text-muted-foreground">
          Monitor your learning progress and performance
        </p>
      </div>

      {/* Courses Selection */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {courses.map((course) => (
          <Card 
            key={course.id} 
            className={`cursor-pointer ${
              selectedCourse === course.id 
                ? "border-primary ring-2 ring-primary" 
                : ""
            }`}
            onClick={() => setSelectedCourse(course.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {course.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courseProgress.find(cp => cp.courseId === course.id)?.progress || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Course Progress
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCourseData && (
        <Tabs defaultValue="progress" className="space-y-4">
          <TabsList>
            <TabsTrigger value="progress">Progress Over Time</TabsTrigger>
            <TabsTrigger value="grades">Assignment Grades</TabsTrigger>
          </TabsList>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>
                  Your learning progress for {selectedCourseData.courseTitle}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Progress Chart */}
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={selectedCourseData.progressHistory}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="progress" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Grades</CardTitle>
                <CardDescription>
                  Your performance in {selectedCourseData.courseTitle}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-4">
                    {selectedCourseData.grades.map((grade, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle>{grade.assignment}</CardTitle>
                          <CardDescription>
                            Submitted on {new Date(grade.submittedAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Score</p>
                              <p className="text-2xl font-bold">
                                {grade.score}/{grade.maxScore}
                              </p>
                            </div>
                            <div>
                              <Progress 
                                value={(grade.score / grade.maxScore) * 100} 
                                className="w-[200px]" 
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}