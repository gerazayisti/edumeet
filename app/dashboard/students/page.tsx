"use client";
import { Metadata } from "next";
import { StudentList } from "@/components/students/student-list";
import { StudentStats } from "@/components/students/student-stats";


export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
        <p className="text-muted-foreground">
          View and manage all students across your courses
        </p>
      </div>

      <StudentStats />
      <StudentList />
    </div>
  );
}
