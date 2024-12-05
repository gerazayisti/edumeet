"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/hooks/use-user"
import {
  BookOpen,
  Calendar,
  Layout,
  LogOut,
  Settings,
  User,
  GraduationCap,
  ClipboardList,
  Users,
  BarChart,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    href: string
    title: string
    icon: React.ReactNode
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2">
      {items.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent" : "transparent",
              className
            )}
          >
            <div className="flex items-center gap-x-2">
              {item.icon}
              <span>{item.title}</span>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, profile, loading } = useUser()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  }

  if (!user || !profile) {
    router.push("/auth")
    return null
  }

  const teacherAdminItems = [
    {
      href: "/dashboard",
      title: "Overview",
      icon: <Layout className="h-4 w-4" />,
    },
    {
      href: "/dashboard/courses",
      title: "Courses",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      href: "/dashboard/students",
      title: "Students",
      icon: <Users className="h-4 w-4" />,
    },
    {
      href: "/dashboard/schedule",
      title: "Schedule",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      href: "/dashboard/analytics",
      title: "Analytics",
      icon: <BarChart className="h-4 w-4" />,
    },
  ]

  const studentItems = [
    {
      href: "/dashboard",
      title: "Overview",
      icon: <Layout className="h-4 w-4" />,
    },
    {
      href: "/dashboard/my-courses",
      title: "My Courses",
      icon: <GraduationCap className="h-4 w-4" />,
    },
    {
      href: "/dashboard/assignments",
      title: "Assignments",
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      href: "/dashboard/schedule",
      title: "Schedule",
      icon: <Calendar className="h-4 w-4" />,
    },
  ]

  const navigationItems = profile.role === 'student' ? studentItems : teacherAdminItems

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden border-r bg-gray-100/40 lg:block lg:w-64">
        <div className="flex h-full flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <Link className="flex items-center gap-2 font-semibold" href="/">
              <span className="text-lg">Learning Platform</span>
            </Link>
          </div>
          <div className="flex-1 space-y-4 p-4">
            <div className="space-y-1">
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                  {profile.role === 'student' ? 'Student Dashboard' : 'Teacher Dashboard'}
                </h2>
                <SidebarNav items={navigationItems} />
              </div>
            </div>
          </div>
          <div className="mt-auto p-4">
            <div className="flex items-center gap-4 px-3 py-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm">{profile.full_name || profile.email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <div className="h-full py-6">
          <div className="px-6">
            <ScrollArea className="h-full">{children}</ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}