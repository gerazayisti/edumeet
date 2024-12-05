"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/use-user";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CourseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  course?: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'active' | 'archived';
  };
}

export function CourseForm({ open, onOpenChange, onSuccess, course }: CourseFormProps) {
  const router = useRouter();
  const { user, profile } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: course?.title || "",
    description: course?.description || "",
    start_date: course?.start_date ? new Date(course.start_date) : undefined,
    end_date: course?.end_date ? new Date(course.end_date) : undefined,
    status: course?.status || "draft",
  });

  // Role validation
  useEffect(() => {
    if (profile && profile.role !== 'teacher') {
      toast({
        title: "Access Denied",
        description: "Only teachers can create or edit courses.",
        variant: "destructive",
      });
      onOpenChange(false);
    }
  }, [profile, onOpenChange, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || profile?.role !== 'teacher') {
      toast({
        title: "Error",
        description: "You don't have permission to perform this action.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Course title is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast({
        title: "Error",
        description: "Course start and end dates are required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.end_date < formData.start_date) {
      toast({
        title: "Error",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date.toISOString(),
        status: formData.status as 'draft' | 'active' | 'archived',
        teacher_id: user.id,
      };

      if (course) {
        // Update existing course
        const { error } = await supabase
          .from("courses")
          .update(courseData)
          .eq("id", course.id)
          .eq("teacher_id", user.id); // Ensure teacher owns the course

        if (error) throw error;

        toast({
          title: "Course Updated",
          description: "Your course has been updated successfully.",
        });
      } else {
        // Create new course
        const { error } = await supabase
          .from("courses")
          .insert([courseData]);

        if (error) throw error;

        toast({
          title: "Course Created",
          description: "Your new course has been created successfully.",
        });
      }

      onSuccess?.();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving course:", error);
      toast({
        title: "Error",
        description: "Failed to save course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {course ? "Edit Course" : "Create New Course"}
            </DialogTitle>
            <DialogDescription>
              {course
                ? "Make changes to your course here."
                : "Add a new course to your teaching portfolio."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                placeholder="Enter course title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter course description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? (
                        format(formData.start_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) =>
                        setFormData({ ...formData, start_date: date || undefined })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? (
                        format(formData.end_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) =>
                        setFormData({ ...formData, end_date: date || undefined })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : course ? "Save Changes" : "Create Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
