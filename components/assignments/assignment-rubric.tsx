"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  points: number;
}

interface RubricProps {
  criteria: RubricCriterion[];
  onChange: (criteria: RubricCriterion[]) => void;
  readOnly?: boolean;
}

export function AssignmentRubric({
  criteria: initialCriteria,
  onChange,
  readOnly = false,
}: RubricProps) {
  const [criteria, setCriteria] = useState<RubricCriterion[]>(initialCriteria);

  const addCriterion = () => {
    const newCriterion: RubricCriterion = {
      id: Math.random().toString(36).substr(2, 9),
      title: "",
      description: "",
      points: 0,
    };
    const updatedCriteria = [...criteria, newCriterion];
    setCriteria(updatedCriteria);
    onChange(updatedCriteria);
  };

  const updateCriterion = (id: string, field: keyof RubricCriterion, value: any) => {
    const updatedCriteria = criteria.map((criterion) =>
      criterion.id === id ? { ...criterion, [field]: value } : criterion
    );
    setCriteria(updatedCriteria);
    onChange(updatedCriteria);
  };

  const removeCriterion = (id: string) => {
    const updatedCriteria = criteria.filter((criterion) => criterion.id !== id);
    setCriteria(updatedCriteria);
    onChange(updatedCriteria);
  };

  const totalPoints = criteria.reduce((sum, criterion) => sum + criterion.points, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Grading Rubric</CardTitle>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Total Points: {totalPoints}
          </span>
          {!readOnly && (
            <Button onClick={addCriterion} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Criterion
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {criteria.map((criterion) => (
            <div
              key={criterion.id}
              className="grid gap-4 rounded-lg border p-4"
            >
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Criterion Title</Label>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCriterion(criterion.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <Input
                  value={criterion.title}
                  onChange={(e) =>
                    updateCriterion(criterion.id, "title", e.target.value)
                  }
                  disabled={readOnly}
                  placeholder="Enter criterion title"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input
                  value={criterion.description}
                  onChange={(e) =>
                    updateCriterion(criterion.id, "description", e.target.value)
                  }
                  disabled={readOnly}
                  placeholder="Enter criterion description"
                />
              </div>
              <div className="grid gap-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  value={criterion.points}
                  onChange={(e) =>
                    updateCriterion(
                      criterion.id,
                      "points",
                      parseInt(e.target.value) || 0
                    )
                  }
                  disabled={readOnly}
                  min={0}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
