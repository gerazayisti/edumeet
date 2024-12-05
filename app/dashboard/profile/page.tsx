"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Camera, Mail, Phone, MapPin, Building, Briefcase, Calendar } from "lucide-react"

type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'student' | 'teacher' | 'admin'
  created_at: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    activeAssignments: 0,
    upcomingMeetings: 0,
    roleSpecificStats: {}
  })

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    getProfile()
  }, [])

  useEffect(() => {
    async function fetchUserStats() {
      if (!user) return;

      try {
        // Total enrolled courses
        const { count: totalCoursesCount } = await supabase
          .from("course_enrollments")
          .select("*", { count: "exact" })
          .eq("student_id", user.id);

        // Completed courses
        const { count: completedCoursesCount } = await supabase
          .from("course_enrollments")
          .select("*", { count: "exact" })
          .eq("student_id", user.id)
          .eq("status", "completed");

        // Active assignments
        const { count: activeAssignmentsCount } = await supabase
          .from("assignments")
          .select("*", { count: "exact" })
          .gt("due_date", new Date().toISOString());

        // Upcoming meetings
        const { count: upcomingMeetingsCount } = await supabase
          .from("meetings")
          .select("*", { count: "exact" })
          .gt("start_time", new Date().toISOString());

        // Role-specific statistics
        let roleSpecificStats = {};
        if (profile?.role === 'teacher') {
          const { count: teacherCoursesCount } = await supabase
            .from("courses")
            .select("*", { count: "exact" })
            .eq("teacher_id", user.id);
          
          roleSpecificStats = {
            coursesTaught: teacherCoursesCount || 0
          };
        } else if (profile?.role === 'student') {
          const { data: grades } = await supabase
            .from("assignment_submissions")
            .select("score")
            .eq("student_id", user.id);
          
          const averageGrade = grades.length 
            ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length 
            : 0;

          roleSpecificStats = {
            averageGrade: averageGrade.toFixed(2)
          };
        }

        setStats({
          totalCourses: totalCoursesCount || 0,
          completedCourses: completedCoursesCount || 0,
          activeAssignments: activeAssignmentsCount || 0,
          upcomingMeetings: upcomingMeetingsCount || 0,
          roleSpecificStats
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les statistiques",
          variant: "destructive"
        });
      }
    }

    if (user) fetchUserStats();
  }, [user, profile]);

  async function getProfile() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      setUser(user)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger le profil",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(formData: FormData) {
    try {
      setLoading(true)
      const updates = {
        id: user?.id,
        email: user?.email,
        full_name: formData.get('full_name') as string | null,
        avatar_url: profile?.avatar_url, // Keep existing avatar URL
        role: profile?.role, // Keep existing role
        created_at: profile?.created_at // Keep existing created_at
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(updates)
        .select()

      if (error) throw error

      // Refresh profile after update
      await getProfile()
      
      setEditMode(false)
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Vous devez sélectionner une image à télécharger.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          avatar_url: filePath,
          updated_at: new Date().toISOString(),
        })

      if (updateError) throw updateError
      
      toast({
        title: "Succès",
        description: "Avatar mis à jour avec succès",
      })
      getProfile()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'avatar",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {editMode && (
                    <label
                      htmlFor="avatar"
                      className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90"
                    >
                      <Camera className="h-4 w-4 text-white" />
                      <input
                        type="file"
                        id="avatar"
                        className="hidden"
                        accept="image/*"
                        onChange={uploadAvatar}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
                <div>
                  <CardTitle>{profile?.full_name || "Utilisateur"}</CardTitle>
                  <CardDescription>{profile?.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!editMode ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span>{profile?.role}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Membre depuis {new Date(profile?.created_at || "").toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  updateProfile(formData)
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nom complet</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      defaultValue={profile?.full_name || ""}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditMode(false)}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</>
                      ) : (
                        "Enregistrer"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tableau de Bord</CardTitle>
              <CardDescription>
                Vue d'ensemble de votre activité sur EduMeet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Cours Total
                  </h3>
                  <p className="text-2xl font-bold">{stats.totalCourses}</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Cours Terminés
                  </h3>
                  <p className="text-2xl font-bold">{stats.completedCourses}</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Assignments Actifs
                  </h3>
                  <p className="text-2xl font-bold">{stats.activeAssignments}</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Réunions à Venir
                  </h3>
                  <p className="text-2xl font-bold">{stats.upcomingMeetings}</p>
                </div>
              </div>

              {profile?.role === 'teacher' && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Statistiques d'Enseignement
                  </h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p>Cours Enseignés: {stats.roleSpecificStats.coursesTaught}</p>
                  </div>
                </div>
              )}

              {profile?.role === 'student' && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Performance Académique
                  </h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p>Moyenne Générale: {stats.roleSpecificStats.averageGrade}/20</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du compte</CardTitle>
              <CardDescription>
                Gérez vos préférences de compte et de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">••••••••</p>
                  <Button variant="outline" size="sm">
                    Changer
                  </Button>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button variant="destructive">
                  Supprimer le compte
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
