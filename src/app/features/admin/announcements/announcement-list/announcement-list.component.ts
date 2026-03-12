import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, LowerCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { AnnouncementService } from '../../services/announcement.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  Announcement,
  AnnouncementStatus,
  AnnouncementPriority,
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_PRIORITIES
} from '../../../../core/models';

@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    DatePipe,
    LowerCasePipe
  ],
  templateUrl: './announcement-list.component.html',
  styleUrl: './announcement-list.component.scss'
})
export class AnnouncementListComponent implements OnInit {
  private announcementService = inject(AnnouncementService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  // State
  announcements = signal<Announcement[]>([]);
  isLoading = signal(false);
  totalElements = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);

  // Filters
  searchQuery = '';
  statusFilter = '';
  priorityFilter = '';
  private searchSubject = new Subject<string>();

  displayedColumns = ['title', 'recipientType', 'priority', 'status', 'readCount', 'publishedAt', 'actions'];

  statusOptions = [
    { value: '', label: 'All Statuses' },
    ...ANNOUNCEMENT_STATUSES
  ];

  priorityOptions = [
    { value: '', label: 'All Priorities' },
    ...ANNOUNCEMENT_PRIORITIES
  ];

  ngOnInit(): void {
    this.loadAnnouncements();
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage.set(0);
      this.loadAnnouncements();
    });
  }

  loadAnnouncements(): void {
    this.isLoading.set(true);
    this.announcementService.getAnnouncements(
      this.currentPage(),
      this.pageSize(),
      this.searchQuery || undefined,
      this.statusFilter || undefined,
      this.priorityFilter || undefined
    ).subscribe({
      next: (response) => {
        this.announcements.set(response.content);
        this.totalElements.set(response.totalElements);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notification.error('Failed to load announcements');
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onStatusChange(): void {
    this.currentPage.set(0);
    this.loadAnnouncements();
  }

  onPriorityChange(): void {
    this.currentPage.set(0);
    this.loadAnnouncements();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadAnnouncements();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.statusFilter = '';
    this.priorityFilter = '';
    this.currentPage.set(0);
    this.loadAnnouncements();
  }

  publishAnnouncement(announcement: Announcement): void {
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
          next: () => {
            this.notification.success('Announcement published successfully');
            this.loadAnnouncements();
          },
          error: () => {
            this.notification.error('Failed to publish announcement');
          }
        });
      }
    });
  }

  archiveAnnouncement(announcement: Announcement): void {
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
          next: () => {
            this.notification.success('Announcement archived successfully');
            this.loadAnnouncements();
          },
          error: () => {
            this.notification.error('Failed to archive announcement');
          }
        });
      }
    });
  }

  deleteAnnouncement(announcement: Announcement): void {
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
            this.loadAnnouncements();
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

   getRecipientTypeLabel(recipientType?: string, targetType?: string): string {
    // Use recipientType if available, fall back to targetType
    if (recipientType) {
      switch (recipientType) {
        case 'ALL_STUDENTS': return 'All Students';
        case 'ALL_TEACHERS': return 'All Teachers';
        case 'ALL_PARENTS': return 'All Parents';
        case 'CLASS': return 'Class(es)';
        case 'INDIVIDUAL': return 'Individual';
        default: return recipientType;
      }
    }
    if (targetType) {
      switch (targetType) {
        case 'ALL': return 'Everyone';
        case 'STUDENTS': return 'All Students';
        case 'TEACHERS': return 'All Teachers';
        case 'PARENTS': return 'All Parents';
        case 'CLASS': return 'Class(es)';
        case 'GRADE': return 'Grade(s)';
        default: return targetType;
      }
    }
    return 'All Recipients';
  }

  getRecipientTypeIcon(recipientType?: string, targetType?: string): string {
    // Use recipientType if available, fall back to targetType
    if (recipientType) {
      switch (recipientType) {
        case 'ALL_STUDENTS': return 'school';
        case 'ALL_TEACHERS': return 'person';
        case 'ALL_PARENTS': return 'family_restroom';
        case 'CLASS': return 'class';
        case 'INDIVIDUAL': return 'person_search';
        default: return 'group';
      }
    }
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
}
