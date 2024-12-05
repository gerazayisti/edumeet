import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";

export function AssignmentStats() {
  const stats = [
    {
      title: "Total Assignments",
      value: "24",
      icon: FileText,
      description: "Active assignments",
    },
    {
      title: "Submitted",
      value: "156",
      icon: CheckCircle,
      description: "Total submissions",
    },
    {
      title: "Pending",
      value: "8",
      icon: Clock,
      description: "Awaiting submission",
    },
    {
      title: "Late Submissions",
      value: "3",
      icon: AlertCircle,
      description: "Past due date",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
