import { EventType, LocationType } from "./cal";

export const DEFAULT_EVENT_TYPES: EventType[] = [
  {
    id: 1,
    title: "Standard Plumbing Inspection",
    slug: "standard-plumbing-inspection",
    description:
      "Comprehensive plumbing inspection including pipe assessment, leak detection, and basic maintenance recommendations",
    length: 90,
    hidden: false,
    userId: 1,
    teamId: null,
    minimumBookingNotice: 240, // 4 hours notice
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
    price: 150,
    currency: "EUR",
  },
  {
    id: 2,
    title: "Toilet Installation Service",
    slug: "toilet-installation",
    description:
      "Professional toilet installation including removal of old unit, installation of new toilet, and testing",
    length: 120,
    hidden: false,
    userId: 1,
    teamId: null,
    minimumBookingNotice: 1440, // 24 hours notice
    beforeEventBuffer: 30,
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
