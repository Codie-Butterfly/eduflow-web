import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, LowerCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

import { StudentAnnouncementService } from '../services/student-announcement.service';
import { FileUploadService } from '../../../shared/services/file-upload.service';
import { Announcement, AnnouncementPriority } from '../../../core/models';

@Component({
  selector: 'app-announcement-inbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatDividerModule,
    MatCheckboxModule,
    DatePipe,
    LowerCasePipe
  ],
  templateUrl: './announcement-inbox.component.html',
  styleUrl: './announcement-inbox.component.scss'
})
export class AnnouncementInboxComponent implements OnInit {
  private announcementService = inject(StudentAnnouncementService);
  private fileUploadService = inject(FileUploadService);

  announcements = signal<(Announcement & { isRead: boolean })[]>([]);
  selectedAnnouncement = signal<(Announcement & { isRead: boolean }) | null>(null);
  isLoading = signal(true);
  unreadCount = signal(0);
  showUnreadOnly = false;

  ngOnInit(): void {
    this.loadAnnouncements();
    this.loadUnreadCount();
  }

  loadAnnouncements(): void {
    this.isLoading.set(true);
    this.announcementService.getAnnouncements(0, 50, this.showUnreadOnly).subscribe({
      next: (response) => {
        this.announcements.set(response.content);
        this.isLoading.set(false);
        // Auto-select first unread or first announcement
        if (response.content.length > 0 && !this.selectedAnnouncement()) {
          const firstUnread = response.content.find(a => !a.isRead);
          this.selectAnnouncement(firstUnread || response.content[0]);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadUnreadCount(): void {
    this.announcementService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadCount.set(count);
      }
    });
  }

  onFilterChange(): void {
    this.selectedAnnouncement.set(null);
    this.loadAnnouncements();
  }

  selectAnnouncement(announcement: Announcement & { isRead: boolean }): void {
    this.selectedAnnouncement.set(announcement);

    // Mark as read if not already
    if (!announcement.isRead) {
      this.announcementService.markAsRead(announcement.id).subscribe({
        next: () => {
          // Update local state only after successful API call
          this.announcements.update(list =>
            list.map(a => a.id === announcement.id ? { ...a, isRead: true } : a)
          );
          this.selectedAnnouncement.update(a => a ? { ...a, isRead: true } : null);
          this.unreadCount.update(c => Math.max(0, c - 1));
        },
        error: (err) => {
          console.error('Failed to mark announcement as read:', err);
          // Don't update local state if API call failed
        }
      });
    }
  }

  getPriorityColor(priority: AnnouncementPriority): string {
    switch (priority) {
      case 'URGENT': return 'warn';
      case 'HIGH': return 'warn';
      case 'NORMAL': return 'primary';
      case 'LOW': return 'accent';
      default: return 'primary';
    }
  }

  getPriorityIcon(priority: AnnouncementPriority): string {
    switch (priority) {
      case 'URGENT': return 'priority_high';
      case 'HIGH': return 'arrow_upward';
      case 'NORMAL': return 'remove';
      case 'LOW': return 'arrow_downward';
      default: return 'remove';
    }
  }

  formatFileSize(bytes: number): string {
    return this.fileUploadService.formatFileSize(bytes);
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('word') || fileType.includes('doc')) return 'description';
    if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('xls')) return 'table_chart';
    if (fileType.includes('image')) return 'image';
    return 'insert_drive_file';
  }

  downloadAttachment(attachment: any): void {
    window.open(attachment.fileUrl, '_blank');
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
}
