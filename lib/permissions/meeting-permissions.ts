export type UserRole = 'admin' | 'instructor' | 'student' | 'guest'
export type MeetingAction = 
  | 'create' 
  | 'edit' 
  | 'delete' 
  | 'view' 
  | 'invite' 
  | 'record'

export interface PermissionConfig {
  [role: string]: {
    [action in MeetingAction]?: boolean
  }
}

export const meetingPermissions: PermissionConfig = {
  admin: {
    create: true,
    edit: true,
    delete: true,
    view: true,
    invite: true,
    record: true
  },
  instructor: {
    create: true,
    edit: true,
    delete: true,
    view: true,
    invite: true,
    record: true
  },
  student: {
    create: false,
    edit: false,
    delete: false,
    view: true,
    invite: false,
    record: false
  },
  guest: {
    create: false,
    edit: false,
    delete: false,
    view: false,
    invite: false,
    record: false
  }
}

export function checkMeetingPermission(
  role: UserRole, 
  action: MeetingAction, 
  context?: {
    isOwnMeeting?: boolean,
    courseRole?: 'owner' | 'member'
  }
): boolean {
  // Base permission check
  const basePermission = meetingPermissions[role]?.[action] || false

  // Context-specific permission enhancement
  if (context) {
    if (context.isOwnMeeting) {
      // More lenient permissions for own meetings
      return true
    }

    if (context.courseRole === 'owner') {
      // Course owners get extended permissions
      return true
    }
  }

  return basePermission
}

export function filterAllowedMeetings(
  meetings: any[], 
  userRole: UserRole
): any[] {
  return meetings.filter(meeting => 
    checkMeetingPermission(userRole, 'view', {
      isOwnMeeting: meeting.host_id === userRole,
      courseRole: meeting.course_owner_id ? 'owner' : 'member'
    })
  )
}

export function getRestrictedMeetingFields(
  userRole: UserRole
): string[] {
  const restrictedFields: {[key in UserRole]: string[]} = {
    admin: [],
    instructor: [],
    student: ['participants', 'recording_url'],
    guest: ['participants', 'recording_url', 'description']
  }

  return restrictedFields[userRole] || []
}
