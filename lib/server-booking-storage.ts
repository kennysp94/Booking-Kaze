/**
 * Server-side booking storage
 * Handles booking persistence on the server using file system
 */

import fs from "fs";
import path from "path";

interface BookingRecord {
  id: string;
  start: string;
  end: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceId: string;
  technicianId: string;
  status: "confirmed" | "pending" | "cancelled";
  createdAt: string;
  kazeJobId?: string;
}

export class ServerBookingStorage {
  private storageFile: string;

  constructor() {
    // Store bookings in a JSON file in the project root
    this.storageFile = path.join(process.cwd(), "bookings.json");
    this.ensureStorageFile();
  }

  /**
   * Ensure the storage file exists
   */
  private ensureStorageFile(): void {
    try {
      if (!fs.existsSync(this.storageFile)) {
        fs.writeFileSync(this.storageFile, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error("Error creating booking storage file:", error);
    }
  }

  /**
   * Get all bookings from file storage
   */
  private getBookings(): BookingRecord[] {
    try {
      const data = fs.readFileSync(this.storageFile, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading bookings from file:", error);
      return [];
    }
  }

  /**
   * Save bookings to file storage
   */
  private saveBookings(bookings: BookingRecord[]): void {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(bookings, null, 2));
    } catch (error) {
      console.error("Error saving bookings to file:", error);
    }
  }

  /**
   * Check if a time slot is available
   */
  isSlotAvailable(
    start: Date,
    end: Date,
    technicianId: string = "default"
  ): boolean {
    const bookings = this.getBookings();
    const startTime = start.getTime();
    const endTime = end.getTime();

    return !bookings.some((booking) => {
      if (
        booking.technicianId !== technicianId ||
        booking.status === "cancelled"
      ) {
        return false;
      }

      const bookingStart = new Date(booking.start).getTime();
      const bookingEnd = new Date(booking.end).getTime();

      // Check for overlap: new slot starts before existing ends AND new slot ends after existing starts
      return startTime < bookingEnd && endTime > bookingStart;
    });
  }

  /**
   * Create a new booking
   */
  createBooking(bookingData: {
    start: string;
    end: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    serviceId: string;
    technicianId?: string;
    kazeJobId?: string;
  }): BookingRecord {
    const bookings = this.getBookings();

    const newBooking: BookingRecord = {
      id: this.generateId(),
      start: bookingData.start,
      end: bookingData.end,
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail,
      customerPhone: bookingData.customerPhone,
      serviceId: bookingData.serviceId,
      technicianId: bookingData.technicianId || "default",
      status: "confirmed",
      createdAt: new Date().toISOString(),
      kazeJobId: bookingData.kazeJobId,
    };

    bookings.push(newBooking);
    this.saveBookings(bookings);

    console.log("✅ Booking created in server storage:", {
      id: newBooking.id,
      start: newBooking.start,
      end: newBooking.end,
      customer: newBooking.customerName,
      kazeJobId: newBooking.kazeJobId,
    });

    return newBooking;
  }

  /**
   * Get bookings for a specific date
   */
  getBookingsForDate(date: string, technicianId?: string): BookingRecord[] {
    const bookings = this.getBookings();
    const targetDate = new Date(date);

    return bookings.filter((booking) => {
      if (technicianId && booking.technicianId !== technicianId) {
        return false;
      }

      const bookingDate = new Date(booking.start);
      return (
        bookingDate.getFullYear() === targetDate.getFullYear() &&
        bookingDate.getMonth() === targetDate.getMonth() &&
        bookingDate.getDate() === targetDate.getDate() &&
        booking.status !== "cancelled"
      );
    });
  }

  /**
   * Get all bookings (for admin/debug purposes)
   */
  getAllBookings(): BookingRecord[] {
    return this.getBookings();
  }

  /**
   * Clear all bookings (for testing)
   */
  clearAllBookings(): void {
    this.saveBookings([]);
    console.log("🧹 All bookings cleared from server storage");
  }

  /**
   * Generate a unique ID for bookings
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Check for duplicate bookings by email and time
   */
  hasDuplicateBooking(email: string, start: string, end: string): boolean {
    const bookings = this.getBookings();
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    return bookings.some((booking) => {
      if (booking.customerEmail !== email || booking.status === "cancelled") {
        return false;
      }

      const bookingStart = new Date(booking.start).getTime();
      const bookingEnd = new Date(booking.end).getTime();

      // Check for exact time match or overlap
      return (
        (startTime >= bookingStart && startTime < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (startTime <= bookingStart && endTime >= bookingEnd)
      );
    });
  }
}

export const serverBookingStorage = new ServerBookingStorage();
