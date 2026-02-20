import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { Student, StudentStatus } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { StudentService } from '../../services/student.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-student-list',
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
    DatePipe
  ],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.scss'
})
export class StudentListComponent implements OnInit {
  private studentService = inject(StudentService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  students = signal<Student[]>([]);
  isLoading = signal(false);
  totalElements = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);

  searchQuery = '';
  statusFilter = '';
  private searchSubject = new Subject<string>();

  displayedColumns = ['studentId', 'fullName', 'class', 'parent', 'status', 'actions'];

  statusOptions: { value: string; label: string }[] = [
    { value: '', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'GRADUATED', label: 'Graduated' },
    { value: 'TRANSFERRED', label: 'Transferred' },
    { value: 'EXPELLED', label: 'Expelled' }
  ];

  ngOnInit(): void {
    this.loadStudents();
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage.set(0);
      this.loadStudents();
    });
  }

  loadStudents(): void {
    this.isLoading.set(true);

    this.studentService.getStudents(
      this.currentPage(),
      this.pageSize(),
      this.searchQuery || undefined,
      this.statusFilter || undefined
    ).subscribe({
      next: (response) => {
        this.students.set(response.content);
        this.totalElements.set(response.totalElements);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notification.error('Failed to load students');
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onStatusChange(): void {
    this.currentPage.set(0);
    this.loadStudents();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadStudents();
  }

  deleteStudent(student: Student): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Student',
        message: `Are you sure you want to delete ${student.fullName}? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.studentService.deleteStudent(student.id).subscribe({
          next: () => {
            this.notification.success('Student deleted successfully');
            this.loadStudents();
          },
          error: () => {
            this.notification.error('Failed to delete student');
          }
        });
      }
    });
  }

  getStatusColor(status: StudentStatus): string {
    switch (status) {
      case 'ACTIVE': return 'primary';
      case 'INACTIVE': return 'accent';
      case 'GRADUATED': return 'primary';
      case 'TRANSFERRED': return 'accent';
      case 'EXPELLED': return 'warn';
      default: return 'primary';
    }
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.statusFilter = '';
    this.currentPage.set(0);
    this.loadStudents();
  }
}