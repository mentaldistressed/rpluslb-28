
export type UserRole = 'admin' | 'sublabel';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type TicketStatus = 'open' | 'in-progress' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';
export type ActivityType = 'update' | 'create' | 'close';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignedTo?: string;
}

export interface Message {
  id: string;
  ticketId: string;
  content: string;
  createdAt: string;
  userId: string;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  ticketId: string;
  timestamp: string;
  date: string;
  time: string;
}

export interface ChangelogEntry {
  id: string;
  version: string;
  description: string | string[];
  created_at: string;
}
