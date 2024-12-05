"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks/use-user";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, TrendingUp, Users, BookOpen, GraduationCap } from "lucide-react";

interface AnalyticsData {
  totalStudents: number;
  totalCourses: number;
  totalAssignments: number;
  completionRate: number;
  courseEngagement: {
    name: string;
    students: number;
    assignments: number;
    completion: number;
  }[];
  studentProgress: {
    date: string;
    completed: number;
    active: number;
  }[];
  assignmentDistribution: {
    name: string;
    value: number;
  }[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function AnalyticsPage() {
  const { user, profile } = useUser();
  const [dateRange, setDateRange] = useState<Date | undefined>(new Date());
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalStudents: 0,
    totalCourses: 0,
    totalAssignments: 0,
    completionRate: 0,
    courseEngagement: [],
    studentProgress: [],
    assignmentDistribution: [],
  });

  useEffect(() => {
    if (!user || profile?.role !== "teacher") return;

    const fetchAnalyticsData = async () => {
      try {
        // Fetch total students
        const { count: studentsCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact" })
          .eq("role", "student");

        // Fetch total courses
        const { count: coursesCount } = await supabase
          .from("courses")
          .select("*", { count: "exact" });

        // Fetch total assignments
        const { count: assignmentsCount } = await supabase
          .from("assignments")
          .select("*", { count: "exact" });

        // Fetch course engagement data
        const { data: courseData } = await supabase
          .from("courses")
          .select(`
            title,
            course_enrollments (count),
            assignments (count),
            assignment_submissions (count)
          `);

        const courseEngagement = courseData?.map((course: any) => ({
          name: course.title,
          students: course.course_enrollments.length,
          assignments: course.assignments.length,
          completion: course.assignment_submissions.length,
        }));

        // Fetch student progress over time
        const { data: progressData } = await supabase
          .from("assignment_submissions")
          .select("created_at, completed")
          .gte("created_at", startOfMonth(dateRange || new Date()).toISOString())
          .lte("created_at", endOfMonth(dateRange || new Date()).toISOString());

        const progressByDate = progressData?.reduce((acc: any, curr: any) => {
          const date = format(new Date(curr.created_at), "MMM d");
          if (!acc[date]) {
            acc[date] = { completed: 0, active: 0 };
          }
          if (curr.completed) {
            acc[date].completed += 1;
          } else {
            acc[date].active += 1;
          }
          return acc;
        }, {});

        const studentProgress = Object.entries(progressByDate || {}).map(
          ([date, data]: [string, any]) => ({
            date,
            ...data,
          })
        );

        // Calculate assignment distribution
        const assignmentDistribution = [
          { name: "Completed", value: 0 },
          { name: "In Progress", value: 0 },
          { name: "Not Started", value: 0 },
        ];

        setAnalyticsData({
          totalStudents: studentsCount || 0,
          totalCourses: coursesCount || 0,
          totalAssignments: assignmentsCount || 0,
          completionRate: 75, // Calculate this based on your data
          courseEngagement: courseEngagement || [],
          studentProgress: studentProgress || [],
          assignmentDistribution: assignmentDistribution || [],
        });
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      }
    };

    fetchAnalyticsData();
  }, [user, profile, dateRange]);

  if (!user || profile?.role !== "teacher") {
    return <div>Access denied. Teachers only.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track and analyze course performance and student engagement
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
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
            <div className="text-2xl font-bold">{analyticsData.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              +20% from last month
            </p>
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
            <div className="text-2xl font-bold">{analyticsData.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.totalAssignments} total assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.completionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Student Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Average course progress
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Course Engagement</TabsTrigger>
          <TabsTrigger value="progress">Student Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Course Engagement Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={analyticsData.courseEngagement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="students" fill="#8884d8" />
                    <Bar dataKey="completion" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Assignment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={analyticsData.assignmentDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.assignmentDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Course Engagement Details</CardTitle>
              <CardDescription>
                Track student engagement across different courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.courseEngagement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#8884d8" />
                  <Bar dataKey="assignments" fill="#82ca9d" />
                  <Bar dataKey="completion" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Student Progress Over Time</CardTitle>
              <CardDescription>
                Track completion rates and active assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.studentProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                  <Line type="monotone" dataKey="active" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}