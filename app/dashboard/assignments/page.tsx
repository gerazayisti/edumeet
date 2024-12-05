"use client";

import { AssignmentList } from "@/components/assignments/assignment-list";
import { AssignmentStats } from "@/components/assignments/assignment-stats";

export default function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground">
          Manage assignments and track student submissions
        </p>
      </div>

      <AssignmentStats />
      <AssignmentList />
    </div>
  );
}
