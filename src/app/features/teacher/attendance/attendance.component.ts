import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatChipsModule } from '@angular/material/chips';

import { TeacherService, TeacherClass, AttendanceRecord } from '../services/teacher.service';
import { NotificationService } from '../../../core/services';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

interface AttendanceEntry {
  studentId: number;
  studentName: string;
  studentNumber: string;
  status: AttendanceStatus;
  remarks: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatRadioModule,
    MatChipsModule,
    DatePipe
  ],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss'
})
export class AttendanceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private teacherService = inject(TeacherService);
  private notification = inject(NotificationService);

  isLoading = signal(true);
  isSaving = signal(false);
  classes = signal<TeacherClass[]>([]);
  attendanceEntries = signal<AttendanceEntry[]>([]);

  selectedClassId: number | null = null;
  selectedDate = new Date();
  maxDate = new Date();

  ngOnInit(): void {
    this.loadClasses();

    // Check for classId in query params
    const classId = this.route.snapshot.queryParamMap.get('classId');
    if (classId) {
      this.selectedClassId = Number(classId);
    }
  }

  private loadClasses(): void {
    this.teacherService.getMyClasses().subscribe({
      next: (data) => {
        this.classes.set(data);
        this.isLoading.set(false);

        if (this.selectedClassId) {
          this.loadAttendance();
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  onClassChange(): void {
    if (this.selectedClassId) {
      this.loadAttendance();
    }
  }

  onDateChange(): void {
    if (this.selectedClassId) {
      this.loadAttendance();
    }
  }

  private loadAttendance(): void {
    if (!this.selectedClassId) return;

    this.isLoading.set(true);
    const dateStr = this.formatDate(this.selectedDate);

    this.teacherService.getAttendanceForDate(this.selectedClassId, dateStr).subscribe({
      next: (records) => {
        this.attendanceEntries.set(records.map(r => ({
          studentId: r.studentId,
          studentName: r.studentName,
          studentNumber: r.studentNumber,
          status: r.status,
          remarks: r.remarks || ''
        })));
        this.isLoading.set(false);
      },
      error: () => {
        // If no records exist, load students and create empty entries
        this.teacherService.getClassStudents(this.selectedClassId!).subscribe({
          next: (students) => {
            this.attendanceEntries.set(students.map(s => ({
              studentId: s.id,
              studentName: s.fullName,
              studentNumber: s.studentId,
              status: 'PRESENT' as AttendanceStatus,
              remarks: ''
            })));
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
      }
    });
  }

  markAllPresent(): void {
    this.attendanceEntries.update(entries =>
      entries.map(e => ({ ...e, status: 'PRESENT' as AttendanceStatus }))
    );
  }

  markAllAbsent(): void {
    this.attendanceEntries.update(entries =>
      entries.map(e => ({ ...e, status: 'ABSENT' as AttendanceStatus }))
    );
  }

  updateStatus(studentId: number, status: AttendanceStatus): void {
    this.attendanceEntries.update(entries =>
      entries.map(e => e.studentId === studentId ? { ...e, status } : e)
    );
  }

  updateRemarks(studentId: number, remarks: string): void {
    this.attendanceEntries.update(entries =>
      entries.map(e => e.studentId === studentId ? { ...e, remarks } : e)
    );
  }

  getStatusCount(status: AttendanceStatus): number {
    return this.attendanceEntries().filter(e => e.status === status).length;
  }

  saveAttendance(): void {
    if (!this.selectedClassId) return;

    this.isSaving.set(true);
    const data = {
      classId: this.selectedClassId,
      date: this.formatDate(this.selectedDate),
      records: this.attendanceEntries().map(e => ({
        studentId: e.studentId,
        status: e.status,
        remarks: e.remarks || undefined
      }))
    };

    this.teacherService.markAttendance(data).subscribe({
      next: (summary) => {
        this.isSaving.set(false);
        this.notification.success(
          `Attendance saved: ${summary.present} present, ${summary.absent} absent, ${summary.late} late`
        );
      },
      error: () => {
        this.isSaving.set(false);
        this.notification.error('Failed to save attendance');
      }
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getSelectedClassName(): string {
    const cls = this.classes().find(c => c.id === this.selectedClassId);
    return cls?.name || '';
  }
}