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
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SchoolClass } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { ClassService } from '../../services/class.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-class-list',
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
    MatSelectModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './class-list.component.html',
  styleUrl: './class-list.component.scss'
})
export class ClassListComponent implements OnInit {
  private classService = inject(ClassService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  classes = signal<SchoolClass[]>([]);
  isLoading = signal(true);
  totalElements = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);

  selectedAcademicYear = '';
  selectedGrade: number | null = null;

  displayedColumns = ['name', 'grade', 'teacher', 'students', 'status', 'actions'];

  academicYears = ['2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'];
  grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.isLoading.set(true);

    this.classService.getClasses(
      this.currentPage(),
      this.pageSize(),
      this.selectedAcademicYear || undefined,
      this.selectedGrade || undefined
    ).subscribe({
      next: (response) => {
        this.classes.set(response.content);
        this.totalElements.set(response.totalElements);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load classes');
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadClasses();
  }

  onFilterChange(): void {
    this.currentPage.set(0);
    this.loadClasses();
  }

  clearFilters(): void {
    this.selectedAcademicYear = '';
    this.selectedGrade = null;
    this.currentPage.set(0);
    this.loadClasses();
  }

  deleteClass(cls: SchoolClass): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Class',
        message: `Are you sure you want to delete ${cls.name}? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.classService.deleteClass(cls.id).subscribe({
          next: () => {
            this.notification.success('Class deleted successfully');
            this.loadClasses();
          },
          error: () => {
            this.notification.error('Failed to delete class');
          }
        });
      }
    });
  }

  getCapacityPercentage(cls: SchoolClass): number {
    if (!cls.capacity || !cls.studentCount) return 0;
    return Math.round((cls.studentCount / cls.capacity) * 100);
  }

  getCapacityColor(cls: SchoolClass): string {
    const percentage = this.getCapacityPercentage(cls);
    if (percentage >= 90) return 'warn';
    if (percentage >= 70) return 'accent';
    return 'primary';
  }
}