export interface CalendarEvent {
  id: number;
  uid: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  timeZone: string;
  location?: string;
  attendees: Attendee[];
  organizer: Organizer;
  status: EventStatus;
  type: number;
  eventTypeId?: number;
}

export interface Attendee {
  email: string;
  name: string;
  timeZone: string;
  language: {
    locale: string;
  };
}

export interface Organizer {
  id: number;
  name: string;
  email: string;
  timeZone: string;
  language: {
    locale: string;
  };
}

export type EventStatus = "ACCEPTED" | "PENDING" | "CANCELLED" | "REJECTED";

export interface AvailabilitySlot {
  time: string;
  userIds: number[];
  attendees?: number;
  bookingUid?: string;
  users?: User[];
}

export interface DateRange {
  start: string;
  end: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  timeZone: string;
  defaultScheduleId?: number;
}

export interface EventType {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  length: number;
  hidden: boolean;
  userId: number;
  teamId: number | null;
  minimumBookingNotice: number;
  beforeEventBuffer: number;
  afterEventBuffer: number;
  locations: EventLocationObject[];
  timeZone: string | null;
  availability?: Availability[];
  schedulingType?: SchedulingType;
  periodType?: PeriodType;
  metadata?: Record<string, unknown>;
  periodStartDate?: Date | null;
  periodEndDate?: Date | null;
  periodDays?: number | null;
  periodCountCalendarDays?: boolean | null;
  requiresConfirmation?: boolean;
  disableGuests?: boolean;
  hideCalendarNotes?: boolean;
  minimumBookingNoticeInDays?: number;
  price?: number;
  currency?: string;
}

export interface EventLocationObject {
  type: LocationType;
  address?: string;
  link?: string;
  phone?: string;
  notes?: string;
  hostPhoneNumber?: string;
}

export type LocationType =
  | "inPerson"
  | "phone"
  | "googlemeet"
  | "zoom"
  | "teams"
  | "whatever"
  | "daily"
  | "jitsi"
  | "huddle01"
  | "tandem"
  | "office";

export interface Availability {
  userId?: number;
  eventTypeId?: number;
  days: number[];
  startTime: string;
  endTime: string;
  date?: string | null;
}

export type SchedulingType = "ROUND_ROBIN" | "COLLECTIVE" | "MANAGED";

export type PeriodType = "UNLIMITED" | "ROLLING" | "RANGE";

export interface BookingCreateBody {
  start: string;
  end: string;
  eventTypeId: number;
  eventTypeSlug: string;
  timeZone: string;
  language: string;
  rescheduleUid?: string;
  user: string;
  metadata?: {
    [key: string]: string;
  };
  responses?: {
    email: string;
    name: string;
    guests?: string[];
    location?: {
      optionValue: string;
      value: string;
    };
    [key: string]: unknown;
  };
}

export interface BookingResponse {
  booking: CalendarEvent;
  status: "SUCCESS" | "ERROR";
  message?: string;
}

export interface AvailabilityResponse {
  busy: DateRange[];
  timeZone: string;
  workingHours: Availability[];
  dateRanges: DateRange[];
  availableSlots: AvailabilitySlot[];
}
