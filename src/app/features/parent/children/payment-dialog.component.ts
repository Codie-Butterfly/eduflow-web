import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ParentService } from '../services/parent.service';
import { NotificationService } from '../../../core/services';
import { StudentFee, PAYMENT_METHODS } from '../../../core/models';

interface DialogData {
  fee: StudentFee;
  childName: string;
}

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    CurrencyPipe
  ],
  template: `
    <h2 mat-dialog-title>Make Payment</h2>
    <mat-dialog-content>
      <div class="fee-summary">
        <div class="fee-info">
          <span class="label">Fee:</span>
          <span class="value">{{ data.fee.feeName }}</span>
        </div>
        <div class="fee-info">
          <span class="label">Student:</span>
          <span class="value">{{ data.childName }}</span>
        </div>
        <div class="fee-info">
          <span class="label">Balance Due:</span>
          <span class="value balance">{{ data.fee.balance | currency:'ZMW':'symbol':'1.0-0' }}</span>
        </div>
      </div>

      <form [formGroup]="paymentForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Amount to Pay</mat-label>
          <input matInput type="number" formControlName="amount" [max]="data.fee.balance">
          <span matTextPrefix>K&nbsp;</span>
          @if (paymentForm.get('amount')?.hasError('required')) {
            <mat-error>Amount is required</mat-error>
          }
          @if (paymentForm.get('amount')?.hasError('min')) {
            <mat-error>Amount must be at least K1</mat-error>
          }
          @if (paymentForm.get('amount')?.hasError('max')) {
            <mat-error>Amount cannot exceed balance</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Payment Method</mat-label>
          <mat-select formControlName="paymentMethod">
            @for (method of paymentMethods; track method.value) {
              <mat-option [value]="method.value">
                <mat-icon>{{ method.icon }}</mat-icon>
                {{ method.label }}
              </mat-option>
            }
          </mat-select>
          @if (paymentForm.get('paymentMethod')?.hasError('required')) {
            <mat-error>Payment method is required</mat-error>
          }
        </mat-form-field>

        @if (showTransactionRef()) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Transaction Reference</mat-label>
            <input matInput formControlName="transactionRef" placeholder="Enter transaction reference">
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Paid By (Full Name)</mat-label>
          <input matInput formControlName="paidBy">
          @if (paymentForm.get('paidBy')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phone Number</mat-label>
          <input matInput formControlName="paidByPhone" placeholder="+260...">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="isSubmitting">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="isSubmitting || paymentForm.invalid">
        @if (isSubmitting) {
          <mat-spinner diameter="20"></mat-spinner>
          <span>Processing...</span>
        } @else {
          <mat-icon>payment</mat-icon>
          <span>Pay {{ paymentForm.get('amount')?.value | currency:'ZMW':'symbol':'1.0-0' }}</span>
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .fee-summary {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;

      .fee-info {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;

        &:not(:last-child) {
          border-bottom: 1px solid #e0e0e0;
        }

        .label {
          color: #666;
        }

        .value {
          font-weight: 500;

          &.balance {
            color: #f44336;
            font-weight: 700;
            font-size: 1.1em;
          }
        }
      }
    }

    .full-width {
      width: 100%;
    }

    mat-dialog-content {
      min-width: 400px;

      @media (max-width: 600px) {
        min-width: auto;
      }
    }

    mat-dialog-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class PaymentDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PaymentDialogComponent>);
  private parentService = inject(ParentService);
  private notification = inject(NotificationService);
  data = inject<DialogData>(MAT_DIALOG_DATA);

  paymentMethods = PAYMENT_METHODS;
  isSubmitting = false;

  paymentForm: FormGroup = this.fb.group({
    amount: [this.data.fee.balance, [Validators.required, Validators.min(1), Validators.max(this.data.fee.balance)]],
    paymentMethod: ['', Validators.required],
    transactionRef: [''],
    paidBy: ['', Validators.required],
    paidByPhone: ['']
  });

  showTransactionRef(): boolean {
    const method = this.paymentForm.get('paymentMethod')?.value;
    return method && method !== 'CASH';
  }

  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.paymentForm.value;

    this.parentService.makePayment({
      studentFeeId: this.data.fee.id,
      amount: formValue.amount,
      paymentMethod: formValue.paymentMethod,
      transactionRef: formValue.transactionRef || undefined,
      paidBy: formValue.paidBy,
      paidByPhone: formValue.paidByPhone || undefined
    }).subscribe({
      next: (payment) => {
        this.notification.success(`Payment of K${formValue.amount} successful! Receipt: ${payment.receiptNumber}`);
        this.dialogRef.close(true);
      },
      error: () => {
        this.isSubmitting = false;
        this.notification.error('Payment failed. Please try again.');
      }
    });
  }
}