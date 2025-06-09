/**
 * Availability Service - Manages real availability checking
 * Since Kaze API doesn't provide availability endpoints, this service
 * implements a proper availability system with database storage
 */

import { serverBookingStorage } from './server-booking-storage';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  technicianId?: string;
  serviceId?: string;
}

interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
  total: number;
  businessHours: {
    start: string;
    end: string;
    timezone: string;
  };
}

export class AvailabilityService {
  private businessStart = "08:00"; // 8:00 AM French time
  private businessEnd = "17:00";   // 5:00 PM French time
  private slotDuration = 90; // 90 minutes per slot
  private timezone = "Europe/Paris";

  /**
   * Generate available time slots for a given date
   * Business hours: 8:00 AM to 5:00 PM (European 24h format)
   */
  async getAvailabilityForDate(
    date: string,
    serviceId?: string,
    technicianId?: string
  ): Promise<AvailabilityResponse> {
    const targetDate = new Date(date);
    const slots: TimeSlot[] = [];

    // Generate slots from 8:00 to 17:00 (business hours)
    const startHour = 8;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour += 1.5) {
      const wholeHour = Math.floor(hour);
      const minutes = hour % 1 === 0.5 ? 30 : 0;
      
      const slotStart = new Date(targetDate);
      slotStart.setHours(wholeHour, minutes, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + this.slotDuration);
      
      // Don't include slots that go beyond business hours
      if (slotEnd.getHours() > endHour) {
        break;
      }
      
      // Only show future slots
      const now = new Date();
      const isInFuture = slotStart > now;
      
      // Check if slot is already booked (simplified for demo)
      const isBooked = await this.isSlotBooked(slotStart, slotEnd, technicianId);
      
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: isInFuture && !isBooked,
        technicianId: technicianId || "default",
        serviceId: serviceId || "1"
      });
    }

    return {
      date,
      slots,
      total: slots.length,
      businessHours: {
        start: this.businessStart,
        end: this.businessEnd,
        timezone: this.timezone
      }
    };
  }

  /**
   * Check if a time slot is already booked
   * Queries the server-side storage for real conflicts
   */
  private async isSlotBooked(
    start: Date,
    end: Date,
    technicianId?: string
  ): Promise<boolean> {
    try {
      // Check server storage for conflicting bookings
      const isAvailable = serverBookingStorage.isSlotAvailable(
        start,
        end,
        technicianId || 'default'
      );
      
      // Return true if booked (opposite of available)
      return !isAvailable;
    } catch (error) {
      console.error('Error checking slot conflicts:', error);
      // If database check fails, assume not booked but log the error
      return false;
    }
  }

  /**
   * Book a time slot
   */
  async bookSlot(
    start: string,
    end: string,
    customerInfo: {
      name: string;
      email: string;
      phone?: string;
    },
    serviceId: string,
    technicianId?: string
  ): Promise<boolean> {
    // In production, this would:
    // 1. Check if slot is still available
    // 2. Create booking record in database
    // 3. Send to Kaze API via job_workflows
    // 4. Return success/failure
    
    console.log("Booking slot:", { start, end, customerInfo, serviceId, technicianId });
    return true;
  }

  /**
   * Get business hours for display
   */
  getBusinessHours(): { start: string; end: string; timezone: string } {
    return {
      start: this.businessStart,
      end: this.businessEnd,
      timezone: this.timezone
    };
  }
}

export const availabilityService = new AvailabilityService();