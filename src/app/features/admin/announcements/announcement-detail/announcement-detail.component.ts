import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, LowerCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { AnnouncementService } from '../../services/announcement.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FileUploadService } from '../../../../shared/services/file-upload.service';
import {
  Announcement,
  AnnouncementStatus,
  AnnouncementPriority
} from '../../../../core/models';

@Component({
  selector: 'app-announcement-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatMenuModule,
    DatePipe,
    LowerCasePipe
  ],
  templateUrl: './announcement-detail.component.html',
  styleUrl: './announcement-detail.component.scss'
})
export class AnnouncementDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private announcementService = inject(AnnouncementService);
  private notification = inject(NotificationService);
  private fileUploadService = inject(FileUploadService);
  private dialog = inject(MatDialog);

  announcement = signal<Announcement | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAnnouncement(parseInt(id, 10));
    }
  }

  private loadAnnouncement(id: number): void {
    this.isLoading.set(true);
    this.announcementService.getAnnouncementById(id).subscribe({
      next: (announcement) => {
        this.announcement.set(announcement);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load announcement');
        this.router.navigate(['/admin/announcements']);
      }
    });
  }

  publishAnnouncement(): void {
    const announcement = this.announcement();
    if (!announcement) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Publish Announcement',
        message: `Are you sure you want to publish "${announcement.title}"? This will make it visible to all recipients.`,
        confirmText: 'Publish',
        confirmColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.announcementService.publishAnnouncement(announcement.id).subscribe({
          next: (updated) => {
            this.announcement.set(updated);
            this.notification.success('Announcement published successfully');
          },
          error: () => {
            this.notification.error('Failed to publish announcement');
          }
        });
      }
    });
  }

  archiveAnnouncement(): void {
    const announcement = this.announcement();
    if (!announcement) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Archive Announcement',
        message: `Are you sure you want to archive "${announcement.title}"?`,
        confirmText: 'Archive',
        confirmColor: 'accent'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.announcementService.archiveAnnouncement(announcement.id).subscribe({
          next: (updated) => {
            this.announcement.set(updated);
            this.notification.success('Announcement archived successfully');
          },
          error: () => {
            this.notification.error('Failed to archive announcement');
          }
        });
      }
    });
  }

  deleteAnnouncement(): void {
    const announcement = this.announcement();
    if (!announcement) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Announcement',
        message: `Are you sure you want to delete "${announcement.title}"? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.announcementService.deleteAnnouncement(announcement.id).subscribe({
          next: () => {
            this.notification.success('Announcement deleted successfully');
            this.router.navigate(['/admin/announcements']);
          },
          error: () => {
            this.notification.error('Failed to delete announcement');
          }
        });
      }
    });
  }

  getStatusColor(status: AnnouncementStatus): string {
    switch (status) {
      case 'PUBLISHED': return 'primary';
      case 'DRAFT': return 'accent';
      case 'ARCHIVED': return '';
      default: return '';
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

  getRecipientTypeLabel(recipientType?: string): string {
    if (!recipientType) {
      // Check targetType as fallback
      const ann = this.announcement();
      const targetType = ann?.targetType;
      if (targetType) {
        switch (targetType) {
          case 'ALL': return 'Everyone';
          case 'STUDENTS': return 'All Students';
          case 'TEACHERS': return 'All Teachers';
          case 'PARENTS': return 'All Parents';
          case 'CLASS': return 'Specific Classes';
          case 'GRADE': return 'Specific Grades';
          default: return targetType;
        }
      }
      return 'All Recipients';
    }
    switch (recipientType) {
      case 'ALL_STUDENTS': return 'All Students';
      case 'ALL_TEACHERS': return 'All Teachers';
      case 'ALL_PARENTS': return 'All Parents';
      case 'CLASS': return 'Specific Classes';
      case 'INDIVIDUAL': return 'Individual Recipients';
      default: return recipientType;
    }
  }

  getRecipientTypeIcon(recipientType?: string): string {
    if (!recipientType) {
      // Check targetType as fallback
      const ann = this.announcement();
      const targetType = ann?.targetType;
      if (targetType) {
        switch (targetType) {
          case 'ALL': return 'groups';
          case 'STUDENTS': return 'school';
          case 'TEACHERS': return 'person';
          case 'PARENTS': return 'family_restroom';
          case 'CLASS': return 'class';
          case 'GRADE': return 'grade';
          default: return 'group';
        }
      }
      return 'group';
    }
    switch (recipientType) {
      case 'ALL_STUDENTS': return 'school';
      case 'ALL_TEACHERS': return 'person';
      case 'ALL_PARENTS': return 'family_restroom';
      case 'CLASS': return 'class';
      case 'INDIVIDUAL': return 'person_search';
      default: return 'group';
    }
  }

  getReadPercentage(): number {
    const ann = this.announcement();
    if (!ann || !ann.totalRecipients || ann.totalRecipients === 0) return 0;
    return Math.round((ann.readCount || 0) / ann.totalRecipients * 100);
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
}
