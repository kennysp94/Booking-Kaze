// TypeScript types for Kaze API integration

export interface KazeAuthResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export interface KazeTimeSlot {
  start_time: string
  end_time: string
  is_available: boolean
  technician_id?: string
  service_id?: string
}

export interface KazeService {
  id: string
  name: string
  description: string
  duration: number // in minutes
  price: number
  category: string
}

export interface KazeTechnician {
  id: string
  name: string
  email: string
  phone?: string
  specialties: string[]
  availability_schedule: {
    [day: string]: {
      start: string
      end: string
    }
  }
}

export interface KazeBooking {
  id: string
  start_time: string
  end_time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  customer: {
    name: string
    email: string
    phone?: string
  }
  service: KazeService
  technician?: KazeTechnician
  notes?: string
  location?: string
  created_at: string
  updated_at: string
}

export interface KazeAvailabilityRequest {
  date: string
  service_id?: string
  technician_id?: string
}

export interface KazeBookingRequest {
  start_time: string
  end_time: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  service_id: string
  technician_id?: string
  notes?: string
}

// Cal.com compatible types
export interface CalAvailabilitySlot {
  start: string
  end: string
}

export interface CalBookingRequest {
  start: string
  end: string
  eventTypeId: string
  name?: string
  email?: string
  phone?: string
  attendees?: Array<{
    name: string
    email: string
    phone?: string
  }>
  notes?: string
  description?: string
  technicianId?: string
}
