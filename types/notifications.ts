export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "assignment" | "course" | "meeting" | "system";
  timestamp: string;
  read?: boolean;
  link?: string;
}
