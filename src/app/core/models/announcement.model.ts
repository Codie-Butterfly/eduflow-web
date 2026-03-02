// Announcement Types
export type RecipientType = 'INDIVIDUAL' | 'ALL_STUDENTS' | 'ALL_TEACHERS' | 'ALL_PARENTS' | 'CLASS';
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// Attachment Interface
export interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt?: string;
}

// Recipient Summary
export interface RecipientSummary {
  id: number;
  name: string;
  email?: string;
  type: 'STUDENT' | 'TEACHER' | 'PARENT';
}

// Class Summary for announcements
export interface AnnouncementClassSummary {
  id: number;
  name: string;
  grade?: number;
}

// Main Announcement Interface
export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  recipientType: RecipientType;
  targetClasses?: AnnouncementClassSummary[];
  targetRecipients?: RecipientSummary[];
  attachments?: Attachment[];
  readCount?: number;
  totalRecipients?: number;
  publishedAt?: string;
  expiresAt?: string;
  createdBy?: string;
  createdById?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Create Request Interface
export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  recipientType: RecipientType;
  targetClassIds?: number[];
  targetRecipientIds?: number[];
  attachmentIds?: number[];
  publishNow?: boolean;
  expiresAt?: string;
}

// Update Request Interface
export interface UpdateAnnouncementRequest extends CreateAnnouncementRequest {
  status?: AnnouncementStatus;
}

// Priority options for dropdowns
export const ANNOUNCEMENT_PRIORITIES: { value: AnnouncementPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'accent' },
  { value: 'NORMAL', label: 'Normal', color: 'primary' },
  { value: 'HIGH', label: 'High', color: 'warn' },
  { value: 'URGENT', label: 'Urgent', color: 'warn' }
];

// Status options for dropdowns
export const ANNOUNCEMENT_STATUSES: { value: AnnouncementStatus; label: string; color: string }[] = [
  { value: 'DRAFT', label: 'Draft', color: 'accent' },
  { value: 'PUBLISHED', label: 'Published', color: 'primary' },
  { value: 'ARCHIVED', label: 'Archived', color: '' }
];

// Recipient type options for dropdowns
export const RECIPIENT_TYPES: { value: RecipientType; label: string; icon: string }[] = [
  { value: 'ALL_STUDENTS', label: 'All Students', icon: 'school' },
  { value: 'ALL_TEACHERS', label: 'All Teachers', icon: 'person' },
  { value: 'ALL_PARENTS', label: 'All Parents', icon: 'family_restroom' },
  { value: 'CLASS', label: 'Specific Class(es)', icon: 'class' },
  { value: 'INDIVIDUAL', label: 'Individual Recipients', icon: 'person_search' }
];

// File upload response
export interface FileUploadResponse {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}
