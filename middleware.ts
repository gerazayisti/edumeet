import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes and their allowed roles
const protectedRoutes = {
  '/dashboards/courses': ['teacher', 'admin'],
  '/dashboards/students': ['teacher', 'admin'],
  '/dashboards/analytics': ['teacher', 'admin'],
  '/dashboards/my-courses': ['student'],
  '/dashboards/assignments': ['student'],
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to auth page
  if (!session) {
    if (req.nextUrl.pathname.startsWith('/dashboards')) {
      return NextResponse.redirect(new URL('/auth', req.url))
    }
    return res
  }

  // If authenticated but on auth page, redirect to dashboard
  if (req.nextUrl.pathname === '/auth') {
    return NextResponse.redirect(new URL('/dashboards', req.url))
  }

  // For protected routes, check user role
  const pathname = req.nextUrl.pathname
  const allowedRoles = protectedRoutes[pathname as keyof typeof protectedRoutes]

  if (allowedRoles) {
    try {
      // Get user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile || !allowedRoles.includes(profile.role)) {
        // If user doesn't have permission, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboards', req.url))
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      // On error, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboards', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/dashboards/:path*',
    '/auth',
  ],
}
