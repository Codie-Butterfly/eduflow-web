import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { NotificationService } from '../../../../core/services';
import { StaffService, Teacher } from '../../services/staff.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './teacher-list.component.html',
  styleUrl: './teacher-list.component.scss'
})
export class TeacherListComponent implements OnInit {
  private staffService = inject(StaffService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  teachers = signal<Teacher[]>([]);
  filteredTeachers = signal<Teacher[]>([]);
  isLoading = signal(true);
  searchQuery = '';

  displayedColumns = ['employeeId', 'name', 'email', 'department', 'subjects', 'status', 'actions'];

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers(): void {
    this.isLoading.set(true);

    this.staffService.getTeachers().subscribe({
      next: (teachers) => {
        this.teachers.set(teachers);
        this.filteredTeachers.set(teachers);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load teachers');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredTeachers.set(this.teachers());
      return;
    }

    const filtered = this.teachers().filter(t =>
      t.fullName.toLowerCase().includes(query) ||
      t.employeeId?.toLowerCase().includes(query) ||
      t.email?.toLowerCase().includes(query) ||
      t.department?.toLowerCase().includes(query)
    );
    this.filteredTeachers.set(filtered);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredTeachers.set(this.teachers());
  }

  deleteTeacher(teacher: Teacher): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Deactivate Teacher',
        message: `Are you sure you want to deactivate ${teacher.fullName}?`,
        confirmText: 'Deactivate',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.staffService.deleteTeacher(teacher.id).subscribe({
          next: () => {
            this.notification.success('Teacher deactivated successfully');
            this.loadTeachers();
          },
          error: () => {
            this.notification.error('Failed to deactivate teacher');
          }
        });
      }
    });
  }

  getSubjectNames(teacher: Teacher): string {
    if (!teacher.subjects || teacher.subjects.length === 0) {
      return 'None assigned';
    }
    return teacher.subjects.map(s => s.name).join(', ');
  }
}