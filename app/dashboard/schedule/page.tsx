"use client";
import { Metadata } from "next";
import { Calendar } from "@/components/schedule/calendar";
import { ScheduleOverview } from "@/components/schedule/schedule-overview";

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
        <p className="text-muted-foreground">
          Manage all your courses and meeting schedules in one place
        </p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <ScheduleOverview />
        <Calendar />
      </div>
    </div>
  );
}
