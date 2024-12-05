"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Plus, Users, Video } from "lucide-react"
import { MeetingsList } from "@/components/meetings/meetings-list"
import { ScheduleMeeting } from "@/components/meetings/schedule-meeting"
import { supabase } from "@/lib/supabase/client"
import { useUser } from "@/lib/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { checkMeetingPermission } from "@/lib/permissions/meeting-permissions"
import type { UserRole } from "@/lib/permissions/meeting-permissions"

export default function MeetingsPage() {
  const { user, profile } = useUser()
  const { toast } = useToast()
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [stats, setStats] = useState({
    todayMeetings: 0,
    totalParticipants: 0,
    scheduledMeetings: 0
  })

  useEffect(() => {
    if (!user) return
    fetchMeetingStats()
  }, [user])

  async function fetchMeetingStats() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      let query = supabase
        .from('meetings')
        .select('id')

      // Si l'utilisateur n'est pas admin ou instructeur, filtrer uniquement ses réunions
      if (!checkMeetingPermission(profile?.role as UserRole, 'view', { isOwnMeeting: true })) {
        query = query.eq('host_id', user?.id)
      }

      // Fetch today's meetings
      const { data: todayMeetings, error: todayError } = await query
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())

      if (todayError) throw todayError

      // Fetch total participants for today's meetings
      const { data: participants, error: participantsError } = await supabase
        .from('meeting_participants')
        .select('id')
        .in('meeting_id', todayMeetings?.map(m => m.id) || [])

      if (participantsError) throw participantsError

      // Fetch upcoming scheduled meetings
      const { data: scheduled, error: scheduledError } = await query
        .gte('start_time', today.toISOString())
        .eq('status', 'scheduled')

      if (scheduledError) throw scheduledError

      setStats({
        todayMeetings: todayMeetings?.length || 0,
        totalParticipants: participants?.length || 0,
        scheduledMeetings: scheduled?.length || 0
      })

    } catch (error) {
      console.error('Error fetching meeting stats:', error)
      toast({
        title: "Error",
        description: "Failed to fetch meeting statistics",
        variant: "destructive",
      })
    }
  }

  // Vérifier si l'utilisateur peut créer des réunions
  const canCreateMeetings = checkMeetingPermission(
    profile?.role as UserRole,
    'create'
  )

  // Vérifier si l'utilisateur peut voir les statistiques
  const canViewStats = checkMeetingPermission(
    profile?.role as UserRole,
    'view',
    { isOwnMeeting: true }
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Meetings</h2>
        {canCreateMeetings && (
          <div className="flex items-center space-x-2">
            <Button onClick={() => setShowScheduleModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Meeting
            </Button>
          </div>
        )}
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="past">Past Meetings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          {canViewStats && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Today's Meetings
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayMeetings}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Participants
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalParticipants}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Scheduled Meetings
                  </CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.scheduledMeetings}</div>
                </CardContent>
              </Card>
            </div>
          )}
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Meetings</CardTitle>
                <CardDescription>
                  {profile?.role === 'admin' || profile?.role === 'instructor'
                    ? 'All recent and upcoming meetings'
                    : 'Your recent and upcoming meetings'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MeetingsList userRole={profile?.role as UserRole} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Meetings</CardTitle>
              <CardDescription>
                {profile?.role === 'admin' || profile?.role === 'instructor'
                  ? 'View and manage all scheduled meetings'
                  : 'View your scheduled meetings'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MeetingsList filter="scheduled" userRole={profile?.role as UserRole} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>Past Meetings</CardTitle>
              <CardDescription>
                {profile?.role === 'admin' || profile?.role === 'instructor'
                  ? 'Review all past meetings and recordings'
                  : 'Review your past meetings'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MeetingsList filter="past" userRole={profile?.role as UserRole} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {showScheduleModal && (
        <ScheduleMeeting 
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setShowScheduleModal(false)
            fetchMeetingStats()
          }}
          userRole={profile?.role as UserRole}
        />
      )}
    </div>
  )
}