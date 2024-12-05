import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, UserCheck, UserX } from "lucide-react";

export function StudentStats() {
  const stats = [
    {
      title: "Total Students",
      value: "245",
      icon: Users,
      description: "Across all courses",
    },
    {
      title: "New This Month",
      value: "12",
      icon: UserPlus,
      description: "Students enrolled",
    },
    {
      title: "Active Students",
      value: "180",
      icon: UserCheck,
      description: "Currently active",
    },
    {
      title: "Inactive Students",
      value: "65",
      icon: UserX,
      description: "Not currently enrolled",
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
