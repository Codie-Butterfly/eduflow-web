import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { StudentService, StudentGrade, StudentGradesResponse } from '../../services/student.service';
import { NotificationService } from '../../../../core/services';

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatTooltipModule,
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './student-grades.component.html',
  styleUrl: './student-grades.component.scss'
})
export class StudentGradesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private studentService = inject(StudentService);
  private notification = inject(NotificationService);

  studentId!: number;
  studentName = signal('');
  isLoading = signal(true);
  grades = signal<StudentGrade[]>([]);
  totalAssessments = signal(0);
  overallAverage = signal<number | null>(null);
  absences = signal(0);

  // Date filters
  startDate: Date | null = null;
  endDate: Date | null = null;

  displayedColumns = ['date', 'subject', 'assessment', 'type', 'score', 'percentage', 'remarks'];

  ngOnInit(): void {
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));

    // Set default date range (current term - last 3 months)
    const today = new Date();
    this.endDate = today;
    this.startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);

    this.loadStudentInfo();
    this.loadGrades();
  }

  private loadStudentInfo(): void {
    this.studentService.getStudentById(this.studentId).subscribe({
      next: (student) => {
        this.studentName.set(student.fullName);
      },
      error: () => {
        this.notification.error('Failed to load student info');
      }
    });
  }

  loadGrades(): void {
    this.isLoading.set(true);

    const startDateStr = this.startDate ? this.formatDate(this.startDate) : undefined;
    const endDateStr = this.endDate ? this.formatDate(this.endDate) : undefined;

    this.studentService.getStudentGrades(this.studentId, startDateStr, endDateStr).subscribe({
      next: (response) => {
        this.grades.set(response.grades);
        this.totalAssessments.set(response.totalAssessments);
        this.overallAverage.set(response.overallAverage);
        this.absences.set(response.absences);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load grades');
        this.isLoading.set(false);
      }
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  onFilterChange(): void {
    this.loadGrades();
  }

  clearFilters(): void {
    const today = new Date();
    this.endDate = today;
    this.startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    this.loadGrades();
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'EXERCISE': 'Exercise',
      'TEST': 'Test',
      'QUIZ': 'Quiz',
      'EXAM': 'Exam',
      'PROJECT': 'Project',
      'ASSIGNMENT': 'Assignment'
    };
    return labels[type] || type;
  }

  getScoreClass(percentage: number | null, absent: boolean): string {
    if (absent) return 'absent';
    if (percentage === null) return '';
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'poor';
  }

  getOverallAverage(): number | null {
    return this.overallAverage();
  }

  getTotalAssessments(): number {
    return this.totalAssessments();
  }

  getAbsentCount(): number {
    return this.absences();
  }
}
