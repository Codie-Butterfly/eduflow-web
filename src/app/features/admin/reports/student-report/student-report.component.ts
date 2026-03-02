import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ReportService, StudentReportData, StudentsByClass, StudentsByGrade } from '../../services/report.service';
import { NotificationService } from '../../../../core/services';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-student-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
    DecimalPipe,
    PercentPipe,
    StatCardComponent
  ],
  templateUrl: './student-report.component.html',
  styleUrl: './student-report.component.scss'
})
export class StudentReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private notification = inject(NotificationService);

  loading = signal(true);
  reportData = signal<StudentReportData | null>(null);

  selectedAcademicYear = '';
  academicYears = ['2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'];

  classColumns = ['className', 'grade', 'totalStudents', 'maleCount', 'femaleCount'];
  gradeColumns = ['grade', 'classCount', 'totalStudents', 'maleCount', 'femaleCount'];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.reportService.getStudentReport(this.selectedAcademicYear || undefined).subscribe({
      next: (data) => {
        console.log('Student report loaded:', data);
        this.reportData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load student report:', err);
        this.notification.error('Failed to load student report');
        this.loading.set(false);
      }
    });
  }

  onAcademicYearChange(): void {
    this.loadReport();
  }

  refreshReport(): void {
    this.loadReport();
  }

  exportReport(): void {
    this.reportService.exportStudentReport(this.selectedAcademicYear || undefined).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student-report-${this.selectedAcademicYear || 'all'}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.notification.success('Report exported successfully');
      },
      error: (err) => {
        console.error('Failed to export report:', err);
        this.notification.error('Failed to export report');
      }
    });
  }

  getGenderRatio(): string {
    const data = this.reportData();
    if (!data || data.summary.totalStudents === 0) return '0:0';
    return `${data.summary.maleStudents}:${data.summary.femaleStudents}`;
  }

  getMalePercentage(): number {
    const data = this.reportData();
    if (!data || data.summary.totalStudents === 0) return 0;
    return (data.summary.maleStudents / data.summary.totalStudents) * 100;
  }

  getFemalePercentage(): number {
    const data = this.reportData();
    if (!data || data.summary.totalStudents === 0) return 0;
    return (data.summary.femaleStudents / data.summary.totalStudents) * 100;
  }

  getMaxEnrollment(): number {
    const data = this.reportData();
    if (!data || data.enrollmentTrends.length === 0) return 1;
    return Math.max(...data.enrollmentTrends.map(t => t.count), 1);
  }

  getBarHeight(count: number): number {
    return (count / this.getMaxEnrollment()) * 100;
  }
}