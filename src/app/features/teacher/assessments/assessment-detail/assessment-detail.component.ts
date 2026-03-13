import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import {
  TeacherService,
  AssessmentDetail,
  AssessmentScore,
  RecordScoreRequest,
  ASSESSMENT_TYPES
} from '../../services/teacher.service';
import { NotificationService } from '../../../../core/services';

interface EditableScore extends AssessmentScore {
  isDirty: boolean;
}

@Component({
  selector: 'app-assessment-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './assessment-detail.component.html',
  styleUrl: './assessment-detail.component.scss'
})
export class AssessmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private teacherService = inject(TeacherService);
  private notification = inject(NotificationService);

  isLoading = signal(true);
  isSaving = signal(false);
  assessment = signal<AssessmentDetail | null>(null);
  scores = signal<EditableScore[]>([]);

  displayedColumns = ['studentNumber', 'studentName', 'score', 'absent', 'remarks'];

  // Computed values
  hasUnsavedChanges = computed(() => this.scores().some(s => s.isDirty));

  scoresEntered = computed(() => {
    return this.scores().filter(s => s.score !== null || s.absent).length;
  });

  totalStudents = computed(() => this.scores().length);

  classAverage = computed(() => {
    const validScores = this.scores()
      .filter(s => s.score !== null && !s.absent)
      .map(s => s.score as number);

    if (validScores.length === 0) return null;

    const maxScore = this.assessment()?.maxScore || 100;
    const sum = validScores.reduce((a, b) => a + b, 0);
    const average = (sum / validScores.length / maxScore) * 100;
    return Math.round(average * 10) / 10;
  });

  progressPercent = computed(() => {
    const total = this.totalStudents();
    if (total === 0) return 0;
    return Math.round((this.scoresEntered() / total) * 100);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAssessment(parseInt(id, 10));
    } else {
      this.notification.error('Assessment ID not found');
      this.router.navigate(['/teacher/assessments']);
    }
  }

  private loadAssessment(id: number): void {
    this.isLoading.set(true);

    this.teacherService.getAssessmentById(id).subscribe({
      next: (assessment) => {
        this.assessment.set(assessment);
        this.scores.set(
          assessment.scores.map(s => ({
            ...s,
            isDirty: false
          }))
        );
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load assessment');
        this.router.navigate(['/teacher/assessments']);
      }
    });
  }

  onScoreChange(studentId: number): void {
    this.scores.update(scores =>
      scores.map(s =>
        s.studentId === studentId ? { ...s, isDirty: true } : s
      )
    );
  }

  onAbsentChange(studentId: number, absent: boolean): void {
    this.scores.update(scores =>
      scores.map(s => {
        if (s.studentId === studentId) {
          return {
            ...s,
            absent,
            score: absent ? null : s.score, // Clear score if marked absent
            isDirty: true
          };
        }
        return s;
      })
    );
  }

  saveScores(): void {
    if (!this.assessment()) return;

    // Validate scores
    const maxScore = this.assessment()!.maxScore;
    const invalidScores = this.scores().filter(
      s => s.score !== null && !s.absent && (s.score < 0 || s.score > maxScore)
    );

    if (invalidScores.length > 0) {
      this.notification.warning(`Some scores are invalid. Scores must be between 0 and ${maxScore}`);
      return;
    }

    this.isSaving.set(true);

    const scoreRequests: RecordScoreRequest[] = this.scores().map(s => ({
      studentId: s.studentId,
      score: s.score,
      absent: s.absent,
      remarks: s.remarks
    }));

    this.teacherService.recordScores(this.assessment()!.id, scoreRequests).subscribe({
      next: (updatedAssessment) => {
        this.assessment.set(updatedAssessment);
        this.scores.set(
          updatedAssessment.scores.map(s => ({
            ...s,
            isDirty: false
          }))
        );
        this.isSaving.set(false);
        this.notification.success('Scores saved successfully');
      },
      error: (error) => {
        this.isSaving.set(false);
        this.notification.error(error.message || 'Failed to save scores');
      }
    });
  }

  getTypeLabel(type: string): string {
    const found = ASSESSMENT_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  }

  getScoreClass(score: number | null, absent: boolean): string {
    if (absent) return 'absent';
    if (score === null) return '';

    const maxScore = this.assessment()?.maxScore || 100;
    const percent = (score / maxScore) * 100;

    if (percent >= 80) return 'excellent';
    if (percent >= 60) return 'good';
    if (percent >= 40) return 'average';
    return 'poor';
  }
}
