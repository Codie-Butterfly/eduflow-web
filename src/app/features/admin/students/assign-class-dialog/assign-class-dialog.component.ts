import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { SchoolClass, Student } from '../../../../core/models';
import { ClassService } from '../../services/class.service';

export interface AssignClassDialogData {
  student: Student;
}

@Component({
  selector: 'app-assign-class-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Assign to Class</h2>
    <mat-dialog-content>
      <p>Assign <strong>{{ data.student.fullName }}</strong> to a class:</p>

      @if (isLoading()) {
        <div class="loading">
          <mat-spinner diameter="30"></mat-spinner>
          <span>Loading classes...</span>
        </div>
      } @else {
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Select Class</mat-label>
          <mat-select [(ngModel)]="selectedClassId">
            @for (cls of classes(); track cls.id) {
              <mat-option [value]="cls.id">
                {{ cls.name }} ({{ cls.academicYear }}) - {{ cls.studentCount || 0 }}/{{ cls.capacity || '∞' }} students
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (data.student.currentClass) {
          <p class="current-class">
            <mat-icon>info</mat-icon>
            Currently enrolled in: <strong>{{ data.student.currentClass.name }}</strong>
          </p>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary"
              [disabled]="!selectedClassId || isSaving()"
              (click)="assign()">
        @if (isSaving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Assign
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .loading {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 0;
    }
    .full-width {
      width: 100%;
    }
    .current-class {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;
      margin-top: 8px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    mat-dialog-content {
      min-width: 350px;
    }
  `]
})
export class AssignClassDialogComponent implements OnInit {
  private classService = inject(ClassService);
  private dialogRef = inject(MatDialogRef<AssignClassDialogComponent>);
  data = inject<AssignClassDialogData>(MAT_DIALOG_DATA);

  classes = signal<SchoolClass[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  selectedClassId: number | null = null;

  ngOnInit(): void {
    this.loadClasses();
  }

  private loadClasses(): void {
    this.classService.getClasses(0, 100).subscribe({
      next: (response) => {
        // Filter to only show active classes
        this.classes.set(response.content.filter(c => c.active));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  assign(): void {
    if (!this.selectedClassId) return;

    this.isSaving.set(true);
    this.dialogRef.close({ classId: this.selectedClassId });
  }
}
