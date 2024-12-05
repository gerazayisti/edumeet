"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AssignmentRubric } from "./assignment-rubric";
import { assignmentsApi } from "@/lib/supabase/api";

interface GradingFormProps {
  submissionId: string;
  rubric: any;
  onGrade: () => void;
}

export function GradingForm({
  submissionId,
  rubric,
  onGrade,
}: GradingFormProps) {
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [grading, setGrading] = useState(false);

  const handleGrade = async () => {
    if (!score) {
      alert("Please enter a score");
      return;
    }

    setGrading(true);
    try {
      await assignmentsApi.grade(submissionId, {
        score,
        feedback,
        rubric_scores: rubricScores,
      });
      onGrade();
    } catch (error) {
      console.error("Error grading submission:", error);
      alert("Error grading submission. Please try again.");
    } finally {
      setGrading(false);
    }
  };

  const updateRubricScore = (criterionId: string, score: number) => {
    setRubricScores((prev) => ({
      ...prev,
      [criterionId]: score,
    }));

    // Update total score based on rubric scores
    const totalScore = Object.values(rubricScores).reduce(
      (sum, score) => sum + score,
      0
    );
    setScore(totalScore);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Submission</CardTitle>
        <CardDescription>
          Review the submission and provide feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AssignmentRubric
          criteria={rubric.criteria}
          onChange={(criteria) => {
            // Reset rubric scores when criteria change
            setRubricScores({});
            setScore(0);
          }}
          readOnly
        />

        <div className="space-y-2">
          <Label>Score</Label>
          <Input
            type="number"
            value={score}
            onChange={(e) => setScore(parseInt(e.target.value) || 0)}
            min={0}
            max={rubric.totalPoints}
          />
          <p className="text-sm text-muted-foreground">
            Maximum points: {rubric.totalPoints}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Feedback</Label>
          <Textarea
            placeholder="Provide feedback to the student..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <Button
          onClick={handleGrade}
          disabled={grading}
          className="w-full"
        >
          {grading ? "Grading..." : "Submit Grade"}
        </Button>
      </CardContent>
    </Card>
  );
}
