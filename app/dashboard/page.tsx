"use client";

import { useUser } from "@/lib/hooks/use-user";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { profile, loading } = useUser();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[250px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[125px] rounded-xl" />
          <Skeleton className="h-[125px] rounded-xl" />
          <Skeleton className="h-[125px] rounded-xl" />
          <Skeleton className="h-[125px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      {profile.role === "student" ? (
        <StudentDashboard />
      ) : (
        <TeacherDashboard />
      )}
    </>
  );
}