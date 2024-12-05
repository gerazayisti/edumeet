"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks/use-user";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Download, FileSpreadsheet, Search, Plus } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";

interface GradeEntry {
  id: string;
  student_name: string;
  assignment_title: string;
  score: number;
  max_score: number;
  feedback: string;
  submitted_at: string;
  graded_at: string;
}

export default function GradesPage() {
  const { user, profile } = useUser();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [courses, setCourses] = useState<any[]>([]);
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [gradeInput, setGradeInput] = useState({
    score: "",
    feedback: "",
  });

  useEffect(() => {
    if (!user || profile?.role !== "teacher") return;

    const fetchData = async () => {
      try {
        // Fetch courses
        const { data: coursesData } = await supabase
          .from("courses")
          .select("*")
          .eq("teacher_id", user.id);

        setCourses(coursesData || []);

        if (selectedCourse) {
          // Fetch students enrolled in the course
          const { data: enrolledStudents } = await supabase
            .from("course_enrollments")
            .select("*, profiles(*)")
            .eq("course_id", selectedCourse);

          setStudents(
            enrolledStudents?.map((enrollment) => enrollment.profiles) || []
          );

          // Fetch assignments for the course
          const { data: courseAssignments } = await supabase
            .from("assignments")
            .select("*")
            .eq("course_id", selectedCourse);

          setAssignments(courseAssignments || []);

          // Fetch grades
          const { data: gradesData } = await supabase
            .from("assignment_submissions")
            .select(`
              *,
              profiles:student_id(full_name),
              assignments(title, max_score)
            `)
            .eq("assignments.course_id", selectedCourse);

          const formattedGrades = gradesData?.map((grade) => ({
            id: grade.id,
            student_name: grade.profiles.full_name,
            assignment_title: grade.assignments.title,
            score: grade.score || 0,
            max_score: grade.assignments.max_score,
            feedback: grade.feedback || "",
            submitted_at: grade.submitted_at,
            graded_at: grade.graded_at,
          }));

          setGrades(formattedGrades || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load grades data",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [user, profile, selectedCourse, toast]);

  const handleGradeSubmission = async () => {
    if (!selectedAssignment || !selectedStudent || !gradeInput.score) return;

    try {
      const { error } = await supabase
        .from("assignment_submissions")
        .update({
          score: parseInt(gradeInput.score),
          feedback: gradeInput.feedback,
          graded_at: new Date().toISOString(),
        })
        .eq("assignment_id", selectedAssignment)
        .eq("student_id", selectedStudent);

      if (error) throw error;

      setIsGradingOpen(false);
      setGradeInput({ score: "", feedback: "" });
      toast({
        title: "Success",
        description: "Grade submitted successfully",
      });

      // Refresh grades
      const { data: updatedGrade } = await supabase
        .from("assignment_submissions")
        .select(`
          *,
          profiles:student_id(full_name),
          assignments(title, max_score)
        `)
        .eq("assignment_id", selectedAssignment)
        .eq("student_id", selectedStudent)
        .single();

      if (updatedGrade) {
        setGrades((prev) =>
          prev.map((grade) =>
            grade.id === updatedGrade.id
              ? {
                  id: updatedGrade.id,
                  student_name: updatedGrade.profiles.full_name,
                  assignment_title: updatedGrade.assignments.title,
                  score: updatedGrade.score || 0,
                  max_score: updatedGrade.assignments.max_score,
                  feedback: updatedGrade.feedback || "",
                  submitted_at: updatedGrade.submitted_at,
                  graded_at: updatedGrade.graded_at,
                }
              : grade
          )
        );
      }
    } catch (error) {
      console.error("Error submitting grade:", error);
      toast({
        title: "Error",
        description: "Failed to submit grade",
        variant: "destructive",
      });
    }
  };

  const filteredGrades = grades.filter(
    (grade) =>
      grade.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grade.assignment_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user || profile?.role !== "teacher") {
    return <div>Access denied. Teachers only.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grade Management</h1>
          <p className="text-muted-foreground">
            Manage and track student grades
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import Grades
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Grades
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student or assignment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Grades</TabsTrigger>
          <TabsTrigger value="pending">Pending Grades</TabsTrigger>
          <TabsTrigger value="graded">Graded</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grade Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredGrades.map((grade) => (
                    <Card key={grade.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {grade.student_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {grade.assignment_title}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                (grade.score / grade.max_score) * 100 >= 70
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {grade.score} / {grade.max_score}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              Submitted:{" "}
                              {format(
                                new Date(grade.submitted_at),
                                "MMM d, yyyy"
                              )}
                            </p>
                          </div>
                        </div>
                        {grade.feedback && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Feedback: {grade.feedback}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {assignment.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Due: {format(new Date(assignment.due_date), "PPP")}
                          </p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                setSelectedAssignment(assignment.id);
                                setIsGradingOpen(true);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Grade Submissions
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Grade Assignment</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Student</Label>
                                <Select
                                  value={selectedStudent}
                                  onValueChange={setSelectedStudent}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a student" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {students.map((student) => (
                                      <SelectItem
                                        key={student.id}
                                        value={student.id}
                                      >
                                        {student.full_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Score (out of {assignment.max_score})</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={assignment.max_score}
                                  value={gradeInput.score}
                                  onChange={(e) =>
                                    setGradeInput({
                                      ...gradeInput,
                                      score: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Feedback</Label>
                                <Input
                                  value={gradeInput.feedback}
                                  onChange={(e) =>
                                    setGradeInput({
                                      ...gradeInput,
                                      feedback: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <Button
                                onClick={handleGradeSubmission}
                                className="w-full"
                              >
                                Submit Grade
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graded">
          <Card>
            <CardContent className="p-6">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredGrades
                    .filter((grade) => grade.graded_at)
                    .map((grade) => (
                      <Card key={grade.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">
                                {grade.student_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {grade.assignment_title}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  (grade.score / grade.max_score) * 100 >= 70
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {grade.score} / {grade.max_score}
                              </Badge>
                              <p className="text-sm text-muted-foreground">
                                Graded:{" "}
                                {format(
                                  new Date(grade.graded_at),
                                  "MMM d, yyyy"
                                )}
                              </p>
                            </div>
                          </div>
                          {grade.feedback && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Feedback: {grade.feedback}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}