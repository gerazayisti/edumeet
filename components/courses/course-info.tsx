import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export function CourseInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Description</Label>
          <p className="text-sm text-muted-foreground">
            This comprehensive mathematics course covers fundamental concepts
            including algebra, geometry, and calculus. Students will learn through
            interactive lectures, problem-solving sessions, and practical
            applications.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Schedule</Label>
          <p className="text-sm text-muted-foreground">
            Monday and Wednesday, 2:00 PM - 3:30 PM
          </p>
        </div>
        <div className="space-y-2">
          <Label>Prerequisites</Label>
          <p className="text-sm text-muted-foreground">
            Basic understanding of arithmetic and pre-algebra concepts
          </p>
        </div>
        <div className="space-y-2">
          <Label>Learning Objectives</Label>
          <ul className="list-disc pl-4 text-sm text-muted-foreground">
            <li>Master algebraic equations and expressions</li>
            <li>Understand geometric principles and proofs</li>
            <li>Introduction to differential calculus</li>
            <li>Problem-solving techniques and applications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}