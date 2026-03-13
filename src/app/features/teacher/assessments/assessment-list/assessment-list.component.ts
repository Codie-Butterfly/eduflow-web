import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  TeacherService,
  Assessment,
  TeacherClass,
  ASSESSMENT_TYPES,
  AssessmentType
} from '../../services/teacher.service';

@Component({
  selector: 'app-assessment-list',
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
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './assessment-list.component.html',
  styleUrl: './assessment-list.component.scss'
})
export class AssessmentListComponent implements OnInit {
  private teacherService = inject(TeacherService);

  isLoading = signal(true);
  assessments = signal<Assessment[]>([]);
  classes = signal<TeacherClass[]>([]);

  // Filters
  selectedClassId = signal<number | null>(null);
  selectedType = signal<AssessmentType | null>(null);

  // Pagination
  totalElements = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);

  // Options
  assessmentTypes = ASSESSMENT_TYPES;

  displayedColumns = ['title', 'class', 'type', 'date', 'progress', 'average', 'actions'];

  ngOnInit(): void {
    this.loadClasses();
    this.loadAssessments();
  }

  private loadClasses(): void {
    this.teacherService.getMyClasses().subscribe({
      next: (data) => this.classes.set(data),
      error: () => console.error('Failed to load classes')
    });
  }

  loadAssessments(): void {
    this.isLoading.set(true);

    const filters: any = {
      page: this.currentPage(),
      size: this.pageSize()
    };

    if (this.selectedClassId()) {
      filters.classId = this.selectedClassId();
    }
    if (this.selectedType()) {
      filters.type = this.selectedType();
    }

    this.teacherService.getAssessments(filters).subscribe({
      next: (response) => {
        this.assessments.set(response.content);
        this.totalElements.set(response.totalElements);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onFilterChange(): void {
    this.currentPage.set(0);
    this.loadAssessments();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadAssessments();
  }

  clearFilters(): void {
    this.selectedClassId.set(null);
    this.selectedType.set(null);
    this.currentPage.set(0);
    this.loadAssessments();
  }

  getProgressPercent(assessment: Assessment): number {
    if (!assessment.totalStudents) return 0;
    return Math.round((assessment.scoresEntered / assessment.totalStudents) * 100);
  }

  getProgressColor(assessment: Assessment): string {
    const percent = this.getProgressPercent(assessment);
    if (percent === 100) return 'primary';
    if (percent >= 50) return 'accent';
    return 'warn';
  }

  getTypeLabel(type: string): string {
    const found = ASSESSMENT_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  }
}
