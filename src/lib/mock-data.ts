
import { User, Ticket, Message } from "@/types";

// Mock users
export const users: User[] = [
  {
    id: "1",
    email: "admin@rpluslb.ru",
    name: "rplus Admin",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AdminRP&backgroundColor=000000&textColor=ffffff"
  },
  {
    id: "2",
    email: "info@rsvtlabel.ru",
    name: "RSVT Label",
    role: "sublabel",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=RSVT&backgroundColor=000000&textColor=ffffff"
  }
];

// Mock tickets
export const tickets: Ticket[] = [
  {
    id: "1",
    title: "Metadata update for new release",
    description: "Need to update the songwriter credits for upcoming release 'Night Vision'",
    status: "open",
    priority: "high",
    createdAt: "2025-04-01T10:00:00Z",
    updatedAt: "2025-04-01T10:00:00Z",
    createdBy: "2"
  },
  {
    id: "2",
    title: "Album artwork replacement",
    description: "The current artwork has a typo in the title, need to upload a new version",
    status: "in-progress",
    priority: "medium",
    createdAt: "2025-04-02T14:30:00Z",
    updatedAt: "2025-04-03T09:15:00Z",
    createdBy: "2",
    assignedTo: "1"
  },
  {
    id: "3",
    title: "Release date change request",
    description: "Due to scheduling conflicts, we need to push back the release date by one week",
    status: "closed",
    priority: "medium",
    createdAt: "2025-03-25T11:45:00Z",
    updatedAt: "2025-03-28T16:20:00Z",
    createdBy: "2",
    assignedTo: "1"
  }
];

// Mock messages
export const messages: Message[] = [
  {
    id: "1",
    ticketId: "1",
    content: "Hello, we need to update the songwriter credits for our upcoming release 'Night Vision'. The current credits are missing our co-writer.",
    createdAt: "2025-04-01T10:00:00Z",
    userId: "2"
  },
  {
    id: "2",
    ticketId: "2",
    content: "We've noticed a typo in our album artwork. The title reads 'Midngiht' instead of 'Midnight'. Please help us replace it with the correct version.",
    createdAt: "2025-04-02T14:30:00Z",
    userId: "2"
  },
  {
    id: "3",
    ticketId: "2",
    content: "I'll take care of this. Please upload the new artwork file and I'll process the replacement.",
    createdAt: "2025-04-02T15:45:00Z",
    userId: "1"
  },
  {
    id: "4",
    ticketId: "2",
    content: "New artwork uploaded. Thank you for your help!",
    createdAt: "2025-04-02T16:20:00Z",
    userId: "2"
  },
  {
    id: "5",
    ticketId: "3",
    content: "Due to some scheduling conflicts with our promo campaign, we need to push back the release date for 'Summer Nights' by one week. Is this possible?",
    createdAt: "2025-03-25T11:45:00Z",
    userId: "2"
  },
  {
    id: "6",
    ticketId: "3",
    content: "Yes, we can accommodate this change. I've updated the release date in our system. The new date is April 15th.",
    createdAt: "2025-03-26T09:30:00Z",
    userId: "1"
  },
  {
    id: "7",
    ticketId: "3",
    content: "Thank you for the quick response. The new date works perfectly for us.",
    createdAt: "2025-03-26T10:15:00Z",
    userId: "2"
  },
  {
    id: "8",
    ticketId: "3",
    content: "You're welcome. I'm closing this ticket now. Please let us know if you need anything else.",
    createdAt: "2025-03-28T16:20:00Z",
    userId: "1"
  }
];
