/**
 * Database Availability Manager
 * Handles booking storage and availability checking with local persistence
 */

interface BookingRecord {
  id: string;
  start: string;
  end: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceId: string;
  technicianId: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
  kazeJobId?: string;
}

export class DatabaseAvailabilityManager {
  private storageKey = 'kaze-bookings';

  /**
   * Get all bookings from local storage
   */
  private getBookings(): BookingRecord[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading bookings from storage:', error);
      return [];
    }
  }

  /**
   * Save bookings to local storage
   */
  private saveBookings(bookings: BookingRecord[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(bookings));
    } catch (error) {
      console.error('Error saving bookings to storage:', error);
    }
  }

  /**
   * Check if a time slot conflicts with existing bookings
   */
  isSlotAvailable(
    start: Date,
    end: Date,
    technicianId: string = 'default'
  ): boolean {
    const bookings = this.getBookings();
    const startTime = start.getTime();
    const endTime = end.getTime();

    return !bookings.some(booking => {
      if (booking.technicianId !== technicianId || booking.status === 'cancelled') {
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
      technicianId: bookingData.technicianId || 'default',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    this.saveBookings(bookings);

    console.log('✅ Booking created in local database:', newBooking);
    return newBooking;
  }

  /**
   * Get bookings for a specific date
   */
  getBookingsForDate(date: string, technicianId?: string): BookingRecord[] {
    const bookings = this.getBookings();
    const targetDate = new Date(date);
    
    return bookings.filter(booking => {
      if (technicianId && booking.technicianId !== technicianId) {
        return false;
      }
      
      const bookingDate = new Date(booking.start);
      return (
        bookingDate.getFullYear() === targetDate.getFullYear() &&
        bookingDate.getMonth() === targetDate.getMonth() &&
        bookingDate.getDate() === targetDate.getDate() &&
        booking.status !== 'cancelled'
      );
    });
  }

  /**
   * Cancel a booking
   */
  cancelBooking(bookingId: string): boolean {
    const bookings = this.getBookings();
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex === -1) {
      return false;
    }

    bookings[bookingIndex].status = 'cancelled';
    this.saveBookings(bookings);
    
    console.log('❌ Booking cancelled:', bookingId);
    return true;
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
    console.log('🧹 All bookings cleared');
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
  hasDuplicateBooking(
    email: string,
    start: string,
    end: string
  ): boolean {
    const bookings = this.getBookings();
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    return bookings.some(booking => {
      if (booking.customerEmail !== email || booking.status === 'cancelled') {
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

export const databaseAvailability = new DatabaseAvailabilityManager();