import { User } from "./auth";

export interface StoredBooking {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM AM/PM format
  startTime: string; // ISO string
  endTime: string; // ISO string
  eventTypeId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceAddress?: string;
  notes?: string;
  kazeJobId?: string;
  status: "confirmed" | "pending" | "cancelled";
  createdAt: string;
}

// In-memory booking store (in production, use a database)
export class BookingStore {
  private static bookings = new Map<string, StoredBooking>();

  // Create a new booking
  static async createBooking(
    user: User,
    bookingData: {
      date: string;
      time: string;
      startTime: string;
      endTime: string;
      eventTypeId: number;
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      serviceAddress?: string;
      notes?: string;
      kazeJobId?: string;
    }
  ): Promise<StoredBooking> {
    const booking: StoredBooking = {
      id: crypto.randomUUID(),
      userId: user.id,
      ...bookingData,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };

    this.bookings.set(booking.id, booking);
    return booking;
  }

  // Check if a time slot is already booked
  static async isSlotBooked(
    date: string,
    time: string,
    eventTypeId: number,
    excludeUserId?: string
  ): Promise<{ isBooked: boolean; booking?: StoredBooking }> {
    const existingBooking = Array.from(this.bookings.values()).find(
      (booking) =>
        booking.date === date &&
        booking.time === time &&
        booking.eventTypeId === eventTypeId &&
        booking.status === "confirmed" &&
        booking.userId !== excludeUserId // Allow same user to check their own bookings
    );

    return {
      isBooked: !!existingBooking,
      booking: existingBooking,
    };
  }

  // Check if user already has a booking for this slot
  static async hasUserBookedSlot(
    userId: string,
    date: string,
    time: string,
    eventTypeId: number
  ): Promise<{ hasBooked: boolean; booking?: StoredBooking }> {
    const userBooking = Array.from(this.bookings.values()).find(
      (booking) =>
        booking.userId === userId &&
        booking.date === date &&
        booking.time === time &&
        booking.eventTypeId === eventTypeId &&
        booking.status === "confirmed"
    );

    return {
      hasBooked: !!userBooking,
      booking: userBooking,
    };
  }

  // Get all bookings for a specific date and event type
  static async getBookingsForDate(
    date: string,
    eventTypeId: number
  ): Promise<StoredBooking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) =>
        booking.date === date &&
        booking.eventTypeId === eventTypeId &&
        booking.status === "confirmed"
    );
  }

  // Get user's bookings
  static async getUserBookings(userId: string): Promise<StoredBooking[]> {
    return Array.from(this.bookings.values())
      .filter((booking) => booking.userId === userId)
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
  }

  // Get booking by ID
  static async getBooking(id: string): Promise<StoredBooking | null> {
    return this.bookings.get(id) || null;
  }

  // Cancel booking
  static async cancelBooking(id: string, userId: string): Promise<boolean> {
    const booking = this.bookings.get(id);
    if (!booking || booking.userId !== userId) {
      return false;
    }

    booking.status = "cancelled";
    return true;
  }

  // Get all booked time slots for a date (for UI display)
  static async getBookedTimeSlotsForDate(
    date: string,
    eventTypeId: number
  ): Promise<string[]> {
    const bookings = await this.getBookingsForDate(date, eventTypeId);
    return bookings.map((booking) => booking.time);
  }

  // Find bookings by email for a specific date and optional time
  static async findUserBookingsByEmail(
    email: string,
    date: string,
    time?: string | null
  ): Promise<StoredBooking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) =>
        booking.customerEmail.toLowerCase() === email.toLowerCase() &&
        booking.date === date &&
        (time ? booking.time === time : true) &&
        booking.status === "confirmed"
    );
  }

  // Get user's bookings within a date range
  static async getUserBookingsInDateRange(
    email: string,
    startDate: string,
    endDate: string
  ): Promise<StoredBooking[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return Array.from(this.bookings.values()).filter((booking) => {
      const bookingDate = new Date(booking.startTime);
      return (
        booking.customerEmail.toLowerCase() === email.toLowerCase() &&
        bookingDate >= start &&
        bookingDate <= end &&
        booking.status === "confirmed"
      );
    });
  }
}
