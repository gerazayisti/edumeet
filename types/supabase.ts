export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          teacher_id: string
          start_date: string | null
          end_date: string | null
          status: 'draft' | 'active' | 'archived'
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          teacher_id: string
          start_date?: string | null
          end_date?: string | null
          status?: 'draft' | 'active' | 'archived'
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          teacher_id?: string
          start_date?: string | null
          end_date?: string | null
          status?: 'draft' | 'active' | 'archived'
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'student' | 'teacher' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'teacher' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'teacher' | 'admin'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
