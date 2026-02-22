import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { NotificationService } from '../../../../core/services';
import { StaffService, Teacher } from '../../services/staff.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './teacher-detail.component.html',
  styleUrl: './teacher-detail.component.scss'
})
export class TeacherDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private staffService = inject(StaffService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  teacher = signal<Teacher | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTeacher(parseInt(id, 10));
    }
  }

  private loadTeacher(id: number): void {
    this.staffService.getTeacherById(id).subscribe({
      next: (teacher) => {
        this.teacher.set(teacher);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Teacher not found');
        this.router.navigate(['/admin/teachers']);
      }
    });
  }

  deleteTeacher(): void {
    const t = this.teacher();
    if (!t) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Deactivate Teacher',
        message: `Are you sure you want to deactivate ${t.fullName}?`,
        confirmText: 'Deactivate',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.staffService.deleteTeacher(t.id).subscribe({
          next: () => {
            this.notification.success('Teacher deactivated successfully');
            this.router.navigate(['/admin/teachers']);
          },
          error: () => {
            this.notification.error('Failed to deactivate teacher');
          }
        });
      }
    });
  }

  getSubjectNames(): string {
    const t = this.teacher();
    if (!t?.subjects || t.subjects.length === 0) {
      return 'None assigned';
    }
    return t.subjects.map(s => s.name).join(', ');
  }
}