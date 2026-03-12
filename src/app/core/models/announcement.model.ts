// Announcement Types
export type TargetType = 'ALL' | 'CLASS' | 'GRADE' | 'PARENTS' | 'TEACHERS' | 'STUDENTS' | 'SPECIFIC_USERS';
export type RecipientType = 'INDIVIDUAL' | 'ALL_STUDENTS' | 'ALL_TEACHERS' | 'ALL_PARENTS' | 'CLASS';
export type AnnouncementStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
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
  targetType?: TargetType;
  recipientType?: RecipientType;  // Legacy field
  targetClasses?: AnnouncementClassSummary[];
  targetRecipients?: RecipientSummary[];
  targetClassIds?: number[];
  targetUserIds?: number[];
  targetGrades?: number[];
  targetIds?: number[];  // Legacy generic field
  attachments?: Attachment[];
  readCount?: number;
  totalRecipients?: number;
  publishedAt?: string;
  scheduledAt?: string;
  expiresAt?: string;
  createdBy?: string;
  createdById?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Create Request Interface (matches backend)
export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  targetType: TargetType;
  targetClassIds?: number[];  // For CLASS target type
  targetUserIds?: number[];   // For SPECIFIC_USERS target type
  targetGrades?: number[];    // For GRADE target type
  attachments?: string[];     // Optional: attachment URLs
  scheduledAt?: string;       // Optional: schedule for later
  expiresAt?: string;         // Optional: auto-expire date
}

// Legacy interface for backwards compatibility
export interface LegacyCreateAnnouncementRequest {
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
  { value: 'SCHEDULED', label: 'Scheduled', color: 'accent' },
  { value: 'PUBLISHED', label: 'Published', color: 'primary' },
  { value: 'ARCHIVED', label: 'Archived', color: '' }
];

// Target type options for dropdowns (matches backend)
export const TARGET_TYPES: { value: TargetType; label: string; icon: string }[] = [
  { value: 'ALL', label: 'Everyone', icon: 'groups' },
  { value: 'STUDENTS', label: 'All Students', icon: 'school' },
  { value: 'TEACHERS', label: 'All Teachers', icon: 'person' },
  { value: 'PARENTS', label: 'All Parents', icon: 'family_restroom' },
  { value: 'CLASS', label: 'Specific Class(es)', icon: 'class' },
  { value: 'GRADE', label: 'Specific Grade(s)', icon: 'grade' },
  { value: 'SPECIFIC_USERS', label: 'Specific Users', icon: 'person_search' }
];

// Legacy recipient type options for backwards compatibility
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
