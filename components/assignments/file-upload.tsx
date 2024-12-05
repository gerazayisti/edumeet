"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabase/api";

interface FileUploadProps {
  onUpload: (urls: string[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

export function FileUpload({
  onUpload,
  maxFiles = 5,
  acceptedFileTypes = ["application/pdf", "image/*", ".doc", ".docx"],
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        alert(`You can only upload up to ${maxFiles} files`);
        return;
      }
      setFiles((prev) => [...prev, ...acceptedFiles]);
    },
    [files.length, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {}
    ),
    maxFiles: maxFiles - files.length,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!files.length) return;

    setUploading(true);
    setProgress(0);

    try {
      const uploadedUrls: string[] = [];
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      let uploadedSize = 0;

      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `assignments/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from("assignments")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("assignments").getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
        uploadedSize += file.size;
        setProgress((uploadedSize / totalSize) * 100);
      }

      onUpload(uploadedUrls);
      setFiles([]);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Files</CardTitle>
        <CardDescription>
          Drag and drop files here or click to select files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragActive ? "border-primary bg-primary/10" : "border-border"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isDragActive
              ? "Drop the files here"
              : `Drag 'n' drop files here, or click to select files`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Accepted file types: {acceptedFileTypes.join(", ")}
          </p>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {uploading ? (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-center text-sm text-muted-foreground">
                  Uploading... {Math.round(progress)}%
                </p>
              </div>
            ) : (
              <Button onClick={uploadFiles} className="w-full">
                Upload {files.length} file{files.length !== 1 && "s"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
