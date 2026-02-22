import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { SelectionModel } from '@angular/cdk/collections';

import { Fee, Student, ClassSummary, FEE_CATEGORIES } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { FeeService } from '../../services/fee.service';
import { StudentService } from '../../services/student.service';
import { ClassService } from '../../services/class.service';

@Component({
  selector: 'app-fee-assignment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatListModule,
    CurrencyPipe
  ],
  templateUrl: './fee-assignment.component.html',
  styleUrl: './fee-assignment.component.scss'
})
export class FeeAssignmentComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private feeService = inject(FeeService);
  private studentService = inject(StudentService);
  private classService = inject(ClassService);
  private notification = inject(NotificationService);

  assignmentForm!: FormGroup;
  isLoading = signal(false);
  isSaving = signal(false);

  fees = signal<Fee[]>([]);
  students = signal<Student[]>([]);
  selectedFee = signal<Fee | null>(null);

  assignmentType: 'students' | 'classes' = 'students';
  studentSelection = new SelectionModel<number>(true, []);

  classes = signal<ClassSummary[]>([]);
  classSelection = new SelectionModel<number>(true, []);

  minDate = new Date();
  categories = FEE_CATEGORIES;

  ngOnInit(): void {
    this.initForm();
    this.loadFees();
    this.loadStudents();
    this.loadClasses();
  }

  private initForm(): void {
    this.assignmentForm = this.fb.group({
      feeId: [null, [Validators.required]],
      dueDate: [null, [Validators.required]],
      discountAmount: [0, [Validators.min(0)]],
      discountReason: ['']
    });

    // Watch for fee selection changes
    this.assignmentForm.get('feeId')?.valueChanges.subscribe(feeId => {
      const fee = this.fees().find(f => f.id === feeId);
      this.selectedFee.set(fee || null);
    });
  }

  private loadFees(): void {
    this.feeService.getFees(0, 100).subscribe({
      next: (response) => {
        console.log('Fee assignment - Fees loaded:', response.content);
        this.fees.set(response.content.filter(f => f.active));
      },
      error: (err) => {
        console.error('Fee assignment - Failed to load fees:', err);
        this.notification.error('Failed to load fees');
      }
    });
  }

  private loadStudents(): void {
    this.studentService.getStudents(0, 100).subscribe({
      next: (response) => {
        console.log('Fee assignment - Students loaded:', response.content);
        this.students.set(response.content.filter(s => s.status === 'ACTIVE'));
      },
      error: (err) => {
        console.error('Fee assignment - Failed to load students:', err);
        this.notification.error('Failed to load students');
      }
    });
  }

  private loadClasses(): void {
    this.classService.getClasses(0, 100).subscribe({
      next: (response) => {
        console.log('Fee assignment - Classes loaded:', response.content);
        const classSummaries: ClassSummary[] = response.content
          .filter(c => c.active)
          .map(c => ({
            id: c.id,
            name: c.name,
            grade: c.grade,
            academicYear: c.academicYear
          }));
        this.classes.set(classSummaries);
      },
      error: (err) => {
        console.error('Fee assignment - Failed to load classes:', err);
        this.notification.error('Failed to load classes');
      }
    });
  }

  onAssignmentTypeChange(type: 'students' | 'classes'): void {
    this.assignmentType = type;
    this.studentSelection.clear();
    this.classSelection.clear();
  }

  toggleStudent(studentId: number): void {
    this.studentSelection.toggle(studentId);
  }

  toggleClass(classId: number): void {
    this.classSelection.toggle(classId);
  }

  selectAllStudents(): void {
    if (this.studentSelection.selected.length === this.students().length) {
      this.studentSelection.clear();
    } else {
      this.students().forEach(s => this.studentSelection.select(s.id));
    }
  }

  selectAllClasses(): void {
    if (this.classSelection.selected.length === this.classes().length) {
      this.classSelection.clear();
    } else {
      this.classes().forEach(c => this.classSelection.select(c.id));
    }
  }

  getCategoryLabel(category: string): string {
    return this.categories.find(c => c.value === category)?.label || category;
  }

  getSelectedCount(): number {
    return this.assignmentType === 'students'
      ? this.studentSelection.selected.length
      : this.classSelection.selected.length;
  }

  onSubmit(): void {
    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    const selectedCount = this.getSelectedCount();
    if (selectedCount === 0) {
      this.notification.warning(`Please select at least one ${this.assignmentType === 'students' ? 'student' : 'class'}`);
      return;
    }

    this.isSaving.set(true);
    const formValue = this.assignmentForm.value;

    const data = {
      feeId: formValue.feeId,
      dueDate: new Date(formValue.dueDate).toISOString().split('T')[0],
      discountAmount: formValue.discountAmount || undefined,
      discountReason: formValue.discountReason || undefined,
      studentIds: this.assignmentType === 'students' ? this.studentSelection.selected : undefined,
      classIds: this.assignmentType === 'classes' ? this.classSelection.selected : undefined
    };

    this.feeService.assignFees(data).subscribe({
      next: () => {
        this.notification.success(`Fee assigned to ${selectedCount} ${this.assignmentType === 'students' ? 'student(s)' : 'class(es)'}`);
        this.router.navigate(['/admin/fees']);
      },
      error: () => {
        this.isSaving.set(false);
        this.notification.error('Failed to assign fees');
      }
    });
  }
}