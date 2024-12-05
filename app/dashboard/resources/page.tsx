"use client";

import { useState } from "react";
import { useUser } from "@/lib/hooks/use-user";
import { useToast } from "@/lib/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Video, Book, Link as LinkIcon, Download, Upload, Search } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  type: "document" | "video" | "book" | "link";
  url: string;
  courseId: string;
  courseName: string;
  uploadedBy: string;
  uploadedAt: string;
  size?: string;
  duration?: string;
}

export default function ResourcesPage() {
  const { user, profile } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [resources] = useState<Resource[]>([
    {
      id: "1",
      title: "Introduction to React",
      type: "document",
      url: "/documents/react-intro.pdf",
      courseId: "course1",
      courseName: "Web Development",
      uploadedBy: "John Doe",
      uploadedAt: "2024-01-15",
      size: "2.5 MB",
    },
    {
      id: "2",
      title: "JavaScript Basics",
      type: "video",
      url: "/videos/js-basics.mp4",
      courseId: "course1",
      courseName: "Web Development",
      uploadedBy: "Jane Smith",
      uploadedAt: "2024-01-14",
      duration: "45:00",
    },
    // Add more sample resources as needed
  ]);

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = () => {
    toast({
      title: "Coming Soon",
      description: "File upload functionality will be available soon.",
    });
  };

  const handleDownload = (resource: Resource) => {
    toast({
      title: "Downloading",
      description: `Downloading ${resource.title}...`,
    });
  };

  const ResourceIcon = ({ type }: { type: Resource["type"] }) => {
    switch (type) {
      case "document":
        return <FileText className="h-6 w-6" />;
      case "video":
        return <Video className="h-6 w-6" />;
      case "book":
        return <Book className="h-6 w-6" />;
      case "link":
        return <LinkIcon className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  if (!user || !profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">
            Access and manage course materials and resources
          </p>
        </div>
        {profile.role === "teacher" && (
          <Button onClick={handleUpload}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Resource
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="books">Books</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredResources.map((resource) => (
            <Card key={resource.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <ResourceIcon type={resource.type} />
                    <div>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <CardDescription>
                        {resource.courseName} • Uploaded by {resource.uploadedBy}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(resource)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">
                    {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                  </Badge>
                  {resource.size && (
                    <span className="text-sm text-muted-foreground">
                      Size: {resource.size}
                    </span>
                  )}
                  {resource.duration && (
                    <span className="text-sm text-muted-foreground">
                      Duration: {resource.duration}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {filteredResources
            .filter((r) => r.type === "document")
            .map((resource) => (
              <Card key={resource.id}>
                {/* Same card content as above */}
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          {filteredResources
            .filter((r) => r.type === "video")
            .map((resource) => (
              <Card key={resource.id}>
                {/* Same card content as above */}
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="books" className="space-y-4">
          {filteredResources
            .filter((r) => r.type === "book")
            .map((resource) => (
              <Card key={resource.id}>
                {/* Same card content as above */}
              </Card>
            ))}
        </TabsContent>
      </Tabs>

      {filteredResources.length === 0 && (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">No resources found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query"
                : "Resources you upload or have access to will appear here"}
            </p>
          </div>
          {profile.role === "teacher" && (
            <Button onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Resource
            </Button>
          )}
        </div>
      )}
    </div>
  );
