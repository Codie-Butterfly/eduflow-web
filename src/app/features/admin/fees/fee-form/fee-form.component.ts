import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Fee, FEE_CATEGORIES, FEE_TERMS } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { FeeService } from '../../services/fee.service';

@Component({
  selector: 'app-fee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './fee-form.component.html',
  styleUrl: './fee-form.component.scss'
})
export class FeeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private feeService = inject(FeeService);
  private notification = inject(NotificationService);

  feeForm!: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);
  feeId = signal<number | null>(null);

  categories = FEE_CATEGORIES;
  terms = FEE_TERMS;
  academicYears = ['2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'];

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.feeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      category: ['', [Validators.required]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      academicYear: ['2024', [Validators.required]],
      term: [''],
      description: ['', [Validators.maxLength(500)]],
      mandatory: [true],
      active: [true]
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.feeId.set(parseInt(id, 10));
      this.loadFee(parseInt(id, 10));
    }
  }

  private loadFee(id: number): void {
    this.isLoading.set(true);

    this.feeService.getFeeById(id).subscribe({
      next: (fee) => {
        this.populateForm(fee);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load fee');
        this.router.navigate(['/admin/fees']);
      }
    });
  }

  private populateForm(fee: Fee): void {
    this.feeForm.patchValue({
      name: fee.name,
      category: fee.category,
      amount: fee.amount,
      academicYear: fee.academicYear,
      term: fee.term || '',
      description: fee.description,
      mandatory: fee.mandatory,
      active: fee.active
    });
  }

  onSubmit(): void {
    if (this.feeForm.invalid) {
      this.feeForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.feeForm.value;

    // Clean up empty term
    const data = {
      ...formValue,
      term: formValue.term || undefined
    };

    if (this.isEditMode()) {
      this.updateFee(data);
    } else {
      this.createFee(data);
    }
  }

  private createFee(data: any): void {
    this.feeService.createFee(data).subscribe({
      next: () => {
        this.notification.success('Fee created successfully');
        this.router.navigate(['/admin/fees']);
      },
      error: () => {
        this.isSaving.set(false);
        this.notification.error('Failed to create fee');
      }
    });
  }

  private updateFee(data: any): void {
    this.feeService.updateFee(this.feeId()!, data).subscribe({
      next: () => {
        this.notification.success('Fee updated successfully');
        this.router.navigate(['/admin/fees']);
      },
      error: () => {
        this.isSaving.set(false);
        this.notification.error('Failed to update fee');
      }
    });
  }

  // Form getters
  get name() { return this.feeForm.get('name'); }
  get category() { return this.feeForm.get('category'); }
  get amount() { return this.feeForm.get('amount'); }
  get academicYear() { return this.feeForm.get('academicYear'); }
  get description() { return this.feeForm.get('description'); }
}