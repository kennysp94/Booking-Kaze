// Kaze API client utility
export class KazeClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl = "https://api.kaze.com") {
    this.baseUrl = baseUrl
  }

  async authenticate(email: string, password: string): Promise<string> {
    const response = await fetch("/api/kaze/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Authentication failed")
    }

    this.token = data.token
    return data.token
  }

  async getAvailability(params: {
    date: string
    serviceId?: string
    technicianId?: string
  }) {
    if (!this.token) {
      throw new Error("Not authenticated")
    }

    const searchParams = new URLSearchParams()
    searchParams.append("date", params.date)
    if (params.serviceId) searchParams.append("serviceId", params.serviceId)
    if (params.technicianId) searchParams.append("technicianId", params.technicianId)

    const response = await fetch(`/api/kaze/availability?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch availability")
    }

    return data.slots
  }

  async createBooking(bookingData: {
    start_time: string
    end_time: string
    customer_name: string
    customer_email: string
    customer_phone?: string
    service_id: string
    technician_id?: string
    notes?: string
  }) {
    if (!this.token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch("/api/kaze/booking", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Booking failed")
    }

    return data.booking
  }

  async getServices() {
    if (!this.token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch("/api/kaze/services", {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch services")
    }

    return data.services
  }

  async getTechnicians(serviceId?: string, date?: string) {
    if (!this.token) {
      throw new Error("Not authenticated")
    }

    const searchParams = new URLSearchParams()
    if (serviceId) searchParams.append("serviceId", serviceId)
    if (date) searchParams.append("date", date)

    const response = await fetch(`/api/kaze/technicians?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch technicians")
    }

    return data.technicians
  }

  setToken(token: string) {
    this.token = token
  }

  getToken(): string | null {
    return this.token
  }
}

export const kazeClient = new KazeClient()
