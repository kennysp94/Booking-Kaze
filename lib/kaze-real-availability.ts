/**
 * Kaze Real Availability Service
 * Fetches actual jobs from Kaze API and calculates real availability
 * Based on the jobs API: https://app.kaze.so/api/jobs.json
 */

import { getCleanKazeToken } from "./kaze-token";

interface KazeJob {
  id: string;
  status: string;
  due_date: string;
  due_time: string;
  technician_id?: string;
  duration_minutes?: number;
  start_time?: string;
  end_time?: string;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  technicianId?: string;
  serviceId?: string;
  conflictingJob?: KazeJob;
}

interface RealAvailabilityResponse {
  date: string;
  slots: TimeSlot[];
  total: number;
  available: number;
  businessHours: {
    start: string;
    end: string;
    timezone: string;
  };
  kazeJobs: KazeJob[];
  source: "kaze-api";
}

export class KazeRealAvailabilityService {
  private businessStart = "08:00"; // 8:00 AM French time
  private businessEnd = "17:00"; // 5:00 PM French time
  private slotDuration = 30; // 30 minutes per slot
  private timezone = "Europe/Paris";
  private kazeApiBase = "https://app.kaze.so";

  /**
   * Get real availability from Kaze API jobs
   */
  async getRealAvailabilityForDate(
    date: string,
    technicianId?: string
  ): Promise<RealAvailabilityResponse> {
    try {
      // Get Kaze API token
      const { token } = getCleanKazeToken();
      if (!token) {
        throw new Error("No Kaze API token available");
      }

      // Fetch jobs for the specific date
      const kazeJobs = await this.fetchKazeJobsForDate(
        date,
        token,
        technicianId
      );

      // Generate all possible 30-minute slots for the day
      const allSlots = this.generateDaySlots(date);

      // Mark slots as unavailable if they conflict with existing jobs
      const availabilitySlots = this.calculateAvailability(
        allSlots,
        kazeJobs,
        technicianId
      );

      const availableCount = availabilitySlots.filter(
        (slot) => slot.available
      ).length;

      return {
        date,
        slots: availabilitySlots,
        total: availabilitySlots.length,
        available: availableCount,
        businessHours: {
          start: this.businessStart,
          end: this.businessEnd,
          timezone: this.timezone,
        },
        kazeJobs,
        source: "kaze-api",
      };
    } catch (error) {
      console.error("Error fetching real availability from Kaze API:", error);

      // Fallback to generating empty slots if API fails
      const allSlots = this.generateDaySlots(date);
      return {
        date,
        slots: allSlots,
        total: allSlots.length,
        available: allSlots.length,
        businessHours: {
          start: this.businessStart,
          end: this.businessEnd,
          timezone: this.timezone,
        },
        kazeJobs: [],
        source: "kaze-api",
      };
    }
  }

  /**
   * Fetch jobs from Kaze API for a specific date
   */
  private async fetchKazeJobsForDate(
    date: string,
    token: string,
    technicianId?: string
  ): Promise<KazeJob[]> {
    // Convert date to DD/MM/YYYY format for Kaze API
    const targetDate = new Date(date);
    const formattedDate = `${targetDate
      .getDate()
      .toString()
      .padStart(2, "0")}/${(targetDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${targetDate.getFullYear()}`;

    console.log(`🔍 Fetching Kaze jobs for date: ${formattedDate}`);

    // Build API URL with filters
    const params = new URLSearchParams({
      "filter[due_date_range]": formattedDate,
      // Get all statuses that might block availability
      "filter[status]": "waiting,confirmed,in_progress,scheduled",
    });

    if (technicianId) {
      params.append("filter[technician_id]", technicianId);
    }

    const apiUrl = `${this.kazeApiBase}/api/jobs.json?${params.toString()}`;

    console.log(`📡 Kaze API Request: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `❌ Kaze API Error: ${response.status} ${response.statusText}`
      );
      const errorText = await response.text();
      console.error("Response body:", errorText);
      throw new Error(`Kaze API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.length || 0} jobs from Kaze API`);

    // Return the jobs array (adjust based on actual API response structure)
    return Array.isArray(data) ? data : data.jobs || [];
  }

  /**
   * Generate all 30-minute slots for a business day (8:00-17:00)
   */
  private generateDaySlots(date: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const targetDate = new Date(date);

    // Generate slots from 8:00 to 17:00 (business hours)
    const startHour = 8;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour += 0.5) {
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

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: isInFuture, // Will be updated based on Kaze jobs
        technicianId: "default",
        serviceId: "1",
      });
    }

    return slots;
  }

  /**
   * Calculate availability by checking conflicts with Kaze jobs
   */
  private calculateAvailability(
    slots: TimeSlot[],
    kazeJobs: KazeJob[],
    technicianId?: string
  ): TimeSlot[] {
    return slots.map((slot) => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);

      // Check if this slot conflicts with any Kaze job
      const conflictingJob = kazeJobs.find((job) => {
        // Filter by technician if specified
        if (
          technicianId &&
          job.technician_id &&
          job.technician_id !== technicianId
        ) {
          return false;
        }

        // Parse job timing
        const jobDateTime = this.parseKazeJobDateTime(job);
        if (!jobDateTime.start || !jobDateTime.end) {
          return false; // Skip jobs without clear timing
        }

        // Check for time overlap
        return this.hasTimeOverlap(
          slotStart,
          slotEnd,
          jobDateTime.start,
          jobDateTime.end
        );
      });

      return {
        ...slot,
        available: slot.available && !conflictingJob,
        conflictingJob: conflictingJob || undefined,
      };
    });
  }

  /**
   * Parse Kaze job date/time information
   */
  private parseKazeJobDateTime(job: KazeJob): {
    start: Date | null;
    end: Date | null;
  } {
    try {
      let startTime: Date | null = null;
      let endTime: Date | null = null;

      // Method 1: Use start_time and end_time if available
      if (job.start_time) {
        startTime = new Date(job.start_time);
      }
      if (job.end_time) {
        endTime = new Date(job.end_time);
      }

      // Method 2: Combine due_date and due_time
      if (!startTime && job.due_date && job.due_time) {
        const dateTime = `${job.due_date}T${job.due_time}`;
        startTime = new Date(dateTime);

        // Estimate end time based on duration or default 2 hours
        const durationMinutes = job.duration_minutes || 120;
        endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
      }

      // Method 3: Use just due_date (assume 2-hour duration)
      if (!startTime && job.due_date) {
        startTime = new Date(job.due_date);
        endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours
      }

      return { start: startTime, end: endTime };
    } catch (error) {
      console.warn("Error parsing Kaze job DateTime:", error);
      return { start: null, end: null };
    }
  }

  /**
   * Check if two time ranges overlap
   */
  private hasTimeOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Get business hours
   */
  getBusinessHours(): { start: string; end: string; timezone: string } {
    return {
      start: this.businessStart,
      end: this.businessEnd,
      timezone: this.timezone,
    };
  }
}

export const kazeRealAvailabilityService = new KazeRealAvailabilityService();
