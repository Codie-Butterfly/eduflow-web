import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { ParentService } from '../services/parent.service';
import { NotificationService } from '../../../core/services';
import { Payment, PAYMENT_METHODS, PAYMENT_STATUSES } from '../../../core/models';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './payment-history.component.html',
  styleUrl: './payment-history.component.scss'
})
export class PaymentHistoryComponent implements OnInit {
  private parentService = inject(ParentService);
  private notification = inject(NotificationService);

  isLoading = signal(true);
  payments = signal<Payment[]>([]);
  totalElements = signal(0);
  pageSize = 10;
  currentPage = 0;

  displayedColumns = ['date', 'student', 'fee', 'amount', 'method', 'receipt', 'status', 'actions'];
  paymentMethods = PAYMENT_METHODS;
  paymentStatuses = PAYMENT_STATUSES;

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading.set(true);
    this.parentService.getPaymentHistory(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.payments.set(response.content);
        this.totalElements.set(response.totalElements);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notification.error('Failed to load payment history');
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPayments();
  }

  getMethodLabel(method: string): string {
    return this.paymentMethods.find(m => m.value === method)?.label || method;
  }

  getMethodIcon(method: string): string {
    return this.paymentMethods.find(m => m.value === method)?.icon || 'payment';
  }

  getStatusColor(status: string): string {
    const statusInfo = this.paymentStatuses.find(s => s.value === status);
    return statusInfo?.color || '';
  }

  getStatusLabel(status: string): string {
    return this.paymentStatuses.find(s => s.value === status)?.label || status;
  }

  downloadReceipt(payment: Payment): void {
    this.notification.info('Downloading receipt...');
    this.parentService.downloadReceipt(payment.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${payment.receiptNumber}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.notification.error('Failed to download receipt');
      }
    });
  }

  getTotalPaid(): number {
    return this.payments()
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);
  }
}