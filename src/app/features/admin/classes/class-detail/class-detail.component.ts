import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SchoolClass, Student } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { ClassService } from '../../services/class.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDialogModule
  ],
  templateUrl: './class-detail.component.html',
  styleUrl: './class-detail.component.scss'
})
export class ClassDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private classService = inject(ClassService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  schoolClass = signal<SchoolClass | null>(null);
  students = signal<Student[]>([]);
  isLoading = signal(true);
  studentsLoading = signal(false);

  studentColumns = ['studentId', 'name', 'gender', 'status', 'actions'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadClass(parseInt(id, 10));
    }
  }

  private loadClass(id: number): void {
    this.classService.getClassById(id).subscribe({
      next: (cls) => {
        this.schoolClass.set(cls);
        this.isLoading.set(false);
        this.loadStudents(id);
      },
      error: () => {
        this.notification.error('Class not found');
        this.router.navigate(['/admin/classes']);
      }
    });
  }

  private loadStudents(classId: number): void {
    this.studentsLoading.set(true);
    this.classService.getClassStudents(classId).subscribe({
      next: (students) => {
        this.students.set(students);
        this.studentsLoading.set(false);
      },
      error: () => {
        this.studentsLoading.set(false);
      }
    });
  }

  deleteClass(): void {
    const cls = this.schoolClass();
    if (!cls) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Class',
        message: `Are you sure you want to delete ${cls.name}? This will remove all student enrollments.`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.classService.deleteClass(cls.id).subscribe({
          next: () => {
            this.notification.success('Class deleted successfully');
            this.router.navigate(['/admin/classes']);
          },
          error: () => {
            this.notification.error('Failed to delete class');
          }
        });
      }
    });
  }

  removeStudent(student: Student): void {
    const cls = this.schoolClass();
    if (!cls) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove Student',
        message: `Remove ${student.fullName} from ${cls.name}?`,
        confirmText: 'Remove',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.classService.removeStudentFromClass(cls.id, student.id).subscribe({
          next: () => {
            this.notification.success('Student removed from class');
            this.loadStudents(cls.id);
          },
          error: () => {
            this.notification.error('Failed to remove student');
          }
        });
      }
    });
  }

  getCapacityPercentage(): number {
    const cls = this.schoolClass();
    if (!cls?.capacity || !cls?.studentCount) return 0;
    return Math.round((cls.studentCount / cls.capacity) * 100);
  }
}