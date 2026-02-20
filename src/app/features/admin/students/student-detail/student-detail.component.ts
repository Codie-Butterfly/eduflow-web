import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';

import { Student, StudentStatus, StudentFee } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { StudentService } from '../../services/student.service';
import { FeeService } from '../../services/fee.service';
import { ClassService } from '../../services/class.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AssignClassDialogComponent } from '../assign-class-dialog/assign-class-dialog.component';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTableModule,
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.scss'
})
export class StudentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private studentService = inject(StudentService);
  private feeService = inject(FeeService);
  private classService = inject(ClassService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  student = signal<Student | null>(null);
  studentFees = signal<StudentFee[]>([]);
  isLoading = signal(true);
  feesLoading = signal(false);
  showFees = signal(false);

  feeColumns = ['feeName', 'category', 'amount', 'paid', 'balance', 'status'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadStudent(parseInt(id, 10));
    }
  }

  private loadStudent(id: number): void {
    this.studentService.getStudentById(id).subscribe({
      next: (student) => {
        this.student.set(student);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Student not found');
        this.router.navigate(['/admin/students']);
      }
    });
  }

  viewFees(): void {
    const student = this.student();
    if (!student) return;

    this.showFees.set(true);
    this.feesLoading.set(true);

    this.feeService.getStudentFees(student.id).subscribe({
      next: (fees) => {
        this.studentFees.set(fees);
        this.feesLoading.set(false);
      },
      error: () => {
        this.feesLoading.set(false);
        this.notification.error('Failed to load fees');
      }
    });
  }

  hideFees(): void {
    this.showFees.set(false);
  }

  deleteStudent(): void {
    const student = this.student();
    if (!student) return;

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
            this.router.navigate(['/admin/students']);
          },
          error: () => {
            this.notification.error('Failed to delete student');
          }
        });
      }
    });
  }

  getStatusColor(status: StudentStatus | string): string {
    switch (status) {
      case 'ACTIVE': return 'primary';
      case 'INACTIVE': return 'accent';
      case 'GRADUATED': return 'primary';
      case 'TRANSFERRED': return 'accent';
      case 'EXPELLED': return 'warn';
      case 'PAID': return 'primary';
      case 'PARTIAL': return 'accent';
      case 'PENDING': return 'primary';
      case 'OVERDUE': return 'warn';
      default: return 'primary';
    }
  }

  calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  getTotalFees(): number {
    return this.studentFees().reduce((sum, fee) => sum + fee.netAmount, 0);
  }

  getTotalPaid(): number {
    return this.studentFees().reduce((sum, fee) => sum + fee.amountPaid, 0);
  }

  getTotalBalance(): number {
    return this.studentFees().reduce((sum, fee) => sum + fee.balance, 0);
  }

  assignToClass(): void {
    const student = this.student();
    if (!student) return;

    const dialogRef = this.dialog.open(AssignClassDialogComponent, {
      width: '450px',
      data: { student }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.classId) {
        this.classService.assignStudentToClass(result.classId, student.id).subscribe({
          next: () => {
            this.notification.success('Student assigned to class successfully');
            this.loadStudent(student.id); // Reload to get updated class info
          },
          error: () => {
            this.notification.error('Failed to assign student to class');
          }
        });
      }
    });
  }
}