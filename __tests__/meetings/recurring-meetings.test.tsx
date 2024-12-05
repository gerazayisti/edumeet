import { render, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ScheduleMeeting } from '@/components/meetings/schedule-meeting'
import { supabase } from '@/lib/supabase/client'

// Mock Supabase and other dependencies
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis()
  }
}))

vi.mock('@/lib/hooks/use-user', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      role: 'instructor',
      email: 'test@example.com'
    }
  })
}))

describe('Recurring Meeting Scheduling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates correct number of meetings for daily recurrence', async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      data: { id: 'meeting-1' },
      error: null
    })

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis()
    })

    const { getByLabelText, getByText } = render(<ScheduleMeeting />)

    // Fill out meeting details
    fireEvent.change(getByLabelText(/meeting title/i), { 
      target: { value: 'Test Recurring Meeting' } 
    })
    fireEvent.change(getByLabelText(/date/i), { 
      target: { value: '2024-01-15' } 
    })
    fireEvent.change(getByLabelText(/time/i), { 
      target: { value: '10:00' } 
    })

    // Set recurring options
    fireEvent.click(getByText(/recurring meeting/i))
    fireEvent.change(getByLabelText(/frequency/i), { 
      target: { value: 'daily' } 
    })
    fireEvent.change(getByLabelText(/interval/i), { 
      target: { value: '1' } 
    })
    fireEvent.change(getByLabelText(/end recurrence/i), { 
      target: { value: 'after' } 
    })
    fireEvent.change(getByLabelText(/occurrences/i), { 
      target: { value: '5' } 
    })

    // Submit form
    fireEvent.click(getByText(/schedule meeting/i))

    // Wait for async operations
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(5)
    })
  })

  it('handles errors in recurring meeting scheduling', async () => {
    const mockInsert = vi.fn().mockRejectedValue(new Error('Scheduling failed'))

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis()
    })

    const { getByLabelText, getByText } = render(<ScheduleMeeting />)

    // Fill out meeting details
    fireEvent.change(getByLabelText(/meeting title/i), { 
      target: { value: 'Test Recurring Meeting' } 
    })
    fireEvent.change(getByLabelText(/date/i), { 
      target: { value: '2024-01-15' } 
    })
    fireEvent.change(getByLabelText(/time/i), { 
      target: { value: '10:00' } 
    })

    // Set recurring options
    fireEvent.click(getByText(/recurring meeting/i))
    fireEvent.change(getByLabelText(/frequency/i), { 
      target: { value: 'weekly' } 
    })
    fireEvent.change(getByLabelText(/interval/i), { 
      target: { value: '2' } 
    })
    fireEvent.change(getByLabelText(/end recurrence/i), { 
      target: { value: 'by' } 
    })
    fireEvent.change(getByLabelText(/end date/i), { 
      target: { value: '2024-02-15' } 
    })

    // Submit form
    fireEvent.click(getByText(/schedule meeting/i))

    // Wait for async operations and check error handling
    await waitFor(() => {
      expect(getByText(/could not schedule recurring meetings/i)).toBeInTheDocument()
    })
  })
})
