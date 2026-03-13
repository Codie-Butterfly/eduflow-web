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
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { TeacherService, TeacherClass, AttendanceRecord, AttendanceHistoryResponse } from '../services/teacher.service';

@Component({
  selector: 'app-attendance-history',
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
    MatTableModule,
    MatChipsModule,
    MatPaginatorModule,
    DatePipe
  ],
  templateUrl: './attendance-history.component.html',
  styleUrl: './attendance-history.component.scss'
})
export class AttendanceHistoryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private teacherService = inject(TeacherService);

  isLoading = signal(true);
  classes = signal<TeacherClass[]>([]);
  historyData = signal<AttendanceHistoryResponse | null>(null);

  selectedClassId: number | null = null;
  startDate: Date;
  endDate: Date;
  maxDate = new Date();

  // Pagination
  paginatedRecords = signal<AttendanceRecord[]>([]);
  pageSize = 20;
  currentPage = 0;

  displayedColumns = ['date', 'studentName', 'studentNumber', 'status', 'remarks'];

  constructor() {
    // Default to current month
    const now = new Date();
    this.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this.endDate = now;
  }

  ngOnInit(): void {
    this.loadClasses();

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
          this.loadHistory();
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  onClassChange(): void {
    if (this.selectedClassId) {
      this.loadHistory();
    }
  }

  onDateChange(): void {
    if (this.selectedClassId && this.startDate && this.endDate) {
      this.loadHistory();
    }
  }

  loadHistory(): void {
    if (!this.selectedClassId || !this.startDate || !this.endDate) return;

    this.isLoading.set(true);
    const startStr = this.formatDate(this.startDate);
    const endStr = this.formatDate(this.endDate);

    this.teacherService.getAttendanceHistory(this.selectedClassId, startStr, endStr).subscribe({
      next: (data) => {
        this.historyData.set(data);
        this.currentPage = 0;
        this.updatePagination();
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  updatePagination(): void {
    const data = this.historyData();
    if (!data) {
      this.paginatedRecords.set([]);
      return;
    }
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedRecords.set(data.records.slice(start, end));
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PRESENT': return 'primary';
      case 'ABSENT': return 'warn';
      case 'LATE': return 'accent';
      case 'EXCUSED': return 'accent';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PRESENT': return 'check_circle';
      case 'ABSENT': return 'cancel';
      case 'LATE': return 'schedule';
      case 'EXCUSED': return 'info';
      default: return 'help';
    }
  }

  getSelectedClassName(): string {
    const cls = this.classes().find(c => c.id === this.selectedClassId);
    return cls?.name || '';
  }

  getStats(): { present: number; absent: number; late: number; excused: number } {
    const data = this.historyData();
    if (!data) return { present: 0, absent: 0, late: 0, excused: 0 };

    return {
      present: data.records.filter(r => r.status === 'PRESENT').length,
      absent: data.records.filter(r => r.status === 'ABSENT').length,
      late: data.records.filter(r => r.status === 'LATE').length,
      excused: data.records.filter(r => r.status === 'EXCUSED').length
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}