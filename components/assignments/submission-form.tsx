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
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "./file-upload";
import { assignmentsApi } from "@/lib/supabase/api";

interface SubmissionFormProps {
  assignmentId: string;
  onSubmit: () => void;
}

export function SubmissionForm({ assignmentId, onSubmit }: SubmissionFormProps) {
  const [content, setContent] = useState("");
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content && !fileUrls.length) {
      alert("Please add a response or upload files");
      return;
    }

    setSubmitting(true);
    try {
      await assignmentsApi.submit(assignmentId, {
        content,
        file_urls: fileUrls,
      });
      onSubmit();
    } catch (error) {
      console.error("Error submitting assignment:", error);
      alert("Error submitting assignment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Assignment</CardTitle>
        <CardDescription>
          Add your response and upload any necessary files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Textarea
            placeholder="Enter your response here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px]"
          />
        </div>

        <FileUpload
          onUpload={(urls) => setFileUrls((prev) => [...prev, ...urls])}
          maxFiles={5}
          acceptedFileTypes={[
            "application/pdf",
            "image/*",
            ".doc",
            ".docx",
            ".txt",
          ]}
        />

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full"
        >
          {submitting ? "Submitting..." : "Submit Assignment"}
        </Button>
      </CardContent>
    </Card>
  );
}
