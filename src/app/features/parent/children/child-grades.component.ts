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

import { ParentService, ChildGrade, ChildSummary } from '../services/parent.service';
import { NotificationService } from '../../../core/services';

@Component({
  selector: 'app-child-grades',
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
  templateUrl: './child-grades.component.html',
  styleUrl: './child-grades.component.scss'
})
export class ChildGradesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private parentService = inject(ParentService);
  private notification = inject(NotificationService);

  childId!: number;
  childName = signal('');
  isLoading = signal(true);
  grades = signal<ChildGrade[]>([]);

  // Date filters
  startDate: Date | null = null;
  endDate: Date | null = null;

  displayedColumns = ['date', 'subject', 'assessment', 'type', 'score', 'percentage', 'remarks'];

  ngOnInit(): void {
    this.childId = Number(this.route.snapshot.paramMap.get('id'));

    // Set default date range (current term - last 3 months)
    const today = new Date();
    this.endDate = today;
    this.startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);

    this.loadChildInfo();
    this.loadGrades();
  }

  private loadChildInfo(): void {
    this.parentService.getChildDetails(this.childId).subscribe({
      next: (child) => {
        this.childName.set(child.fullName);
      },
      error: () => {
        this.notification.error('Failed to load child info');
      }
    });
  }

  loadGrades(): void {
    this.isLoading.set(true);

    const startDateStr = this.startDate ? this.formatDate(this.startDate) : undefined;
    const endDateStr = this.endDate ? this.formatDate(this.endDate) : undefined;

    this.parentService.getChildGrades(this.childId, startDateStr, endDateStr).subscribe({
      next: (data) => {
        this.grades.set(data);
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
    const validGrades = this.grades().filter(g => g.percentage !== null && !g.absent);
    if (validGrades.length === 0) return null;
    const sum = validGrades.reduce((acc, g) => acc + (g.percentage || 0), 0);
    return Math.round((sum / validGrades.length) * 10) / 10;
  }

  getTotalAssessments(): number {
    return this.grades().length;
  }

  getAbsentCount(): number {
    return this.grades().filter(g => g.absent).length;
  }
}
