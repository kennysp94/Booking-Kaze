import { EventType, LocationType } from "./cal";

export const DEFAULT_EVENT_TYPES: EventType[] = [
  {
    id: 1,
    title: "Basic Plumbing Service",
    slug: "basic-plumbing",
    description:
      "Basic plumbing services including inspection and small repairs",
    length: 60,
    hidden: false,
    userId: 1,
    teamId: null,
    minimumBookingNotice: 120, // 2 hours
    beforeEventBuffer: 15,
    afterEventBuffer: 15,
    locations: [
      {
        type: "inPerson" as LocationType,
        address: "Customer Location",
      },
    ],
    timeZone: "UTC",
    requiresConfirmation: false,
    disableGuests: true,
    hideCalendarNotes: false,
    minimumBookingNoticeInDays: 0,
    price: 100,
    currency: "USD",
  },
  {
    id: 2,
    title: "Emergency Plumbing Service",
    slug: "emergency-plumbing",
    description: "24/7 emergency plumbing services for urgent issues",
    length: 120,
    hidden: false,
    userId: 1,
    teamId: null,
    minimumBookingNotice: 30, // 30 minutes
    beforeEventBuffer: 0,
    afterEventBuffer: 30,
    locations: [
      {
        type: "inPerson" as LocationType,
        address: "Customer Location",
      },
    ],
    timeZone: "UTC",
    requiresConfirmation: true,
    disableGuests: true,
    hideCalendarNotes: false,
    minimumBookingNoticeInDays: 0,
    price: 200,
    currency: "USD",
  },
];
