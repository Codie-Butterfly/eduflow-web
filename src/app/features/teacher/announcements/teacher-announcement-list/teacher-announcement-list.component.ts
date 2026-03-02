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

import { TeacherAnnouncementService } from '../../services/teacher-announcement.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  Announcement,
  AnnouncementStatus,
  AnnouncementPriority,
  ANNOUNCEMENT_STATUSES
} from '../../../../core/models';

@Component({
  selector: 'app-teacher-announcement-list',
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
  templateUrl: './teacher-announcement-list.component.html',
  styleUrl: './teacher-announcement-list.component.scss'
})
export class TeacherAnnouncementListComponent implements OnInit {
  private announcementService = inject(TeacherAnnouncementService);
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
  private searchSubject = new Subject<string>();

  displayedColumns = ['title', 'targetClasses', 'priority', 'status', 'readCount', 'publishedAt', 'actions'];

  statusOptions = [
    { value: '', label: 'All Statuses' },
    ...ANNOUNCEMENT_STATUSES
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
    this.announcementService.getMyAnnouncements(
      this.currentPage(),
      this.pageSize(),
      this.searchQuery || undefined,
      this.statusFilter || undefined
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

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadAnnouncements();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.statusFilter = '';
    this.currentPage.set(0);
    this.loadAnnouncements();
  }

  publishAnnouncement(announcement: Announcement): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Publish Announcement',
        message: `Are you sure you want to publish "${announcement.title}"? This will notify all students in the selected classes.`,
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

  getTargetClassesLabel(announcement: Announcement): string {
    if (!announcement.targetClasses?.length) return '-';
    if (announcement.targetClasses.length === 1) {
      return announcement.targetClasses[0].name;
    }
    return `${announcement.targetClasses.length} classes`;
  }
}
