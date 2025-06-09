// Kaze API client utility
export class KazeClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(
    baseUrl = process.env.KAZE_API_BASE_URL || "https://app.kaze.so"
  ) {
    this.baseUrl = baseUrl;

    // Note: We no longer need to authenticate explicitly in the client
    // The server-side endpoints already use KAZE_API_TOKEN from .env
    // This token is DIFFERENT from the web user authentication token
  }

  /**
   * @deprecated Use server endpoints directly with environment KAZE_API_TOKEN
   */
  async authenticate(email: string, password: string): Promise<string> {
    // This method is deprecated as we're using environment variables for Kaze API auth
    console.warn(
      "KazeClient.authenticate() is deprecated - using server-side API token instead"
    );

    const response = await fetch("/api/kaze/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Authentication failed");
    }

    this.token = data.token;
    return data.token;
  }

  async getAvailability(params: {
    date: string;
    serviceId?: string;
    technicianId?: string;
  }) {
    // No need to check for token as server-side will use KAZE_API_TOKEN from .env

    const searchParams = new URLSearchParams();
    searchParams.append("date", params.date);
    if (params.serviceId) searchParams.append("serviceId", params.serviceId);
    if (params.technicianId)
      searchParams.append("technicianId", params.technicianId);

    // Don't include Kaze API token in client-side requests
    // The server endpoint will use its own API token from environment variables
    const response = await fetch(`/api/kaze/availability?${searchParams}`);

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch availability");
    }

    return data.slots;
  }

  async createBooking(bookingData: {
    start_time: string;
    end_time: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    service_id: string;
    technician_id?: string;
    notes?: string;
  }) {
    // No need to check for client-side token
    // The server endpoint will use KAZE_API_TOKEN from environment variables

    // Don't include Kaze API token in client-side requests
    const response = await fetch("/api/kaze/booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Booking failed");
    }

    return data.booking;
  }

  async getServices() {
    // No need to check for client-side token
    // The server endpoint will use KAZE_API_TOKEN from environment variables

    // Don't include Kaze API token in client-side requests
    const response = await fetch("/api/kaze/services");

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch services");
    }

    return data.services;
  }

  async getTechnicians(serviceId?: string, date?: string) {
    if (!this.token) {
      throw new Error("Not authenticated");
    }

    const searchParams = new URLSearchParams();
    if (serviceId) searchParams.append("serviceId", serviceId);
    if (date) searchParams.append("date", date);

    const response = await fetch(`/api/kaze/technicians?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch technicians");
    }

    return data.technicians;
  }

  async getBookings(params?: {
    startDate?: string;
    endDate?: string;
    customerEmail?: string;
    limit?: number;
  }) {
    // No need to check for client-side token
    // The server endpoint will use KAZE_API_TOKEN from environment variables

    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.customerEmail)
      searchParams.append("customerEmail", params.customerEmail);
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    // Don't include Kaze API token in client-side requests
    const response = await fetch(`/api/kaze/bookings?${searchParams}`);

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch bookings");
    }

    return {
      bookings: data.bookings,
      meta: data.meta,
    };
  }

  setToken(token: string) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const kazeClient = new KazeClient();
