import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ParentService } from '../services/parent.service';
import { NotificationService } from '../../../core/services';
import { Student, StudentFee, PAYMENT_METHODS } from '../../../core/models';
import { PaymentDialogComponent } from './payment-dialog.component';

@Component({
  selector: 'app-child-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './child-detail.component.html',
  styleUrl: './child-detail.component.scss'
})
export class ChildDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private parentService = inject(ParentService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  childId!: number;
  isLoading = signal(true);
  child = signal<Student | null>(null);
  fees = signal<StudentFee[]>([]);

  displayedColumns = ['fee', 'dueDate', 'amount', 'paid', 'balance', 'status', 'actions'];

  ngOnInit(): void {
    this.childId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadChildData();

    // Check if we need to open payment dialog
    if (this.route.snapshot.queryParamMap.get('pay') === 'true') {
      // Will open dialog after data loads
    }
  }

  private loadChildData(): void {
    this.isLoading.set(true);

    this.parentService.getChildDetails(this.childId).subscribe({
      next: (data) => {
        this.child.set(data);
      },
      error: () => {
        this.notification.error('Failed to load child details');
        this.router.navigate(['/parent/children']);
      }
    });

    this.parentService.getChildFees(this.childId).subscribe({
      next: (data) => {
        this.fees.set(data);
        this.isLoading.set(false);

        // Open payment dialog if requested via query param
        if (this.route.snapshot.queryParamMap.get('pay') === 'true') {
          const pendingFees = data.filter(f => f.balance > 0);
          if (pendingFees.length > 0) {
            this.openPaymentDialog(pendingFees[0]);
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.notification.error('Failed to load fees');
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PAID': return 'primary';
      case 'PARTIAL': return 'accent';
      case 'PENDING': return 'warn';
      case 'OVERDUE': return 'warn';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PAID': return 'Paid';
      case 'PARTIAL': return 'Partial';
      case 'PENDING': return 'Pending';
      case 'OVERDUE': return 'Overdue';
      case 'WAIVED': return 'Waived';
      default: return status;
    }
  }

  getTotalFees(): number {
    return this.fees().reduce((sum, f) => sum + f.netAmount, 0);
  }

  getTotalPaid(): number {
    return this.fees().reduce((sum, f) => sum + f.amountPaid, 0);
  }

  getTotalBalance(): number {
    return this.fees().reduce((sum, f) => sum + f.balance, 0);
  }

  openPaymentDialog(fee: StudentFee): void {
    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '500px',
      data: { fee, childName: this.child()?.fullName }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadChildData();
      }
    });
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }
}