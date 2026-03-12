import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { ReportService, PaymentHistoryReportData, PaymentRecord } from '../../services/report.service';
import { NotificationService } from '../../../../core/services';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-payment-history-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DatePipe,
    CurrencyPipe,
    StatCardComponent
  ],
  templateUrl: './payment-history-report.component.html',
  styleUrl: './payment-history-report.component.scss'
})
export class PaymentHistoryReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private notification = inject(NotificationService);

  loading = signal(true);
  reportData = signal<PaymentHistoryReportData | null>(null);

  startDate: Date | null = null;
  endDate: Date | null = null;
  searchQuery = '';

  filteredPayments = signal<PaymentRecord[]>([]);
  paginatedPayments = signal<PaymentRecord[]>([]);

  pageSize = 10;
  currentPage = 0;
  totalElements = 0;

  displayedColumns = ['paidAt', 'studentName', 'className', 'feeName', 'amount', 'paymentMethod', 'transactionRef'];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    const startDateStr = this.startDate ? this.formatDate(this.startDate) : undefined;
    const endDateStr = this.endDate ? this.formatDate(this.endDate) : undefined;
    this.reportService.getPaymentHistoryReport(
      startDateStr,
      endDateStr
    ).subscribe({
      next: (data) => {
        console.log('Payment history report loaded:', data);
        this.reportData.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load payment history report:', err);
        this.notification.error('Failed to load payment history report');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    const data = this.reportData();
    if (!data) return;

    let filtered = data.payments;

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.studentName.toLowerCase().includes(query) ||
        p.studentCode.toLowerCase().includes(query) ||
        p.feeName.toLowerCase().includes(query) ||
        p.transactionRef.toLowerCase().includes(query)
      );
    }

    this.filteredPayments.set(filtered);
    this.totalElements = filtered.length;
    this.currentPage = 0;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedPayments.set(this.filteredPayments().slice(start, end));
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onDateFilterChange(): void {
    this.loadReport();
  }

  refreshReport(): void {
    this.loadReport();
  }

  getMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      'CASH': 'Cash',
      'BANK_TRANSFER': 'Bank Transfer',
      'MOBILE_MONEY_MTN': 'MTN Money',
      'MOBILE_MONEY_AIRTEL': 'Airtel Money',
      'MOBILE_MONEY_ZAMTEL': 'Zamtel Money',
      'VISA': 'Visa',
      'MASTERCARD': 'Mastercard',
      'CHEQUE': 'Cheque'
    };
    return labels[method] || method;
  }

  getMethodColor(method: string): string {
    if (method.includes('MOBILE')) return 'accent';
    if (method === 'CASH') return 'primary';
    if (method.includes('BANK') || method === 'CHEQUE') return 'primary';
    return 'primary';
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}