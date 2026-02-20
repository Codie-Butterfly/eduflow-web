import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { StudentPortalService } from '../services/student-portal.service';
import { StudentFee, Payment, PAYMENT_METHODS, PAYMENT_STATUSES } from '../../../core/models';

@Component({
  selector: 'app-student-fees',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './student-fees.component.html',
  styleUrl: './student-fees.component.scss'
})
export class StudentFeesComponent implements OnInit {
  private studentService = inject(StudentPortalService);

  isLoading = signal(true);
  fees = signal<StudentFee[]>([]);
  payments = signal<Payment[]>([]);
  totalPayments = signal(0);

  feeColumns = ['fee', 'dueDate', 'amount', 'paid', 'balance', 'status'];
  paymentColumns = ['date', 'fee', 'amount', 'method', 'receipt', 'status'];

  paymentMethods = PAYMENT_METHODS;
  paymentStatuses = PAYMENT_STATUSES;

  pageSize = 10;
  currentPage = 0;

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.studentService.getMyFees().subscribe({
      next: (data) => {
        this.fees.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.loadPayments();
  }

  private loadPayments(): void {
    this.studentService.getPaymentHistory(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.payments.set(response.content);
        this.totalPayments.set(response.totalElements);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPayments();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PAID':
      case 'COMPLETED': return 'primary';
      case 'PARTIAL': return 'accent';
      case 'OVERDUE':
      case 'PENDING': return 'warn';
      default: return '';
    }
  }

  getMethodLabel(method: string): string {
    return this.paymentMethods.find(m => m.value === method)?.label || method;
  }

  getMethodIcon(method: string): string {
    return this.paymentMethods.find(m => m.value === method)?.icon || 'payment';
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

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }
}