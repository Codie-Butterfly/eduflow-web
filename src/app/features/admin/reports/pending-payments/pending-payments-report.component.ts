import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ReportService, PendingPaymentsReportData, PendingPaymentRecord } from '../../services/report.service';
import { FeeService } from '../../services/fee.service';
import { NotificationService } from '../../../../core/services';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-pending-payments-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule,
    DatePipe,
    CurrencyPipe,
    StatCardComponent
  ],
  templateUrl: './pending-payments-report.component.html',
  styleUrl: './pending-payments-report.component.scss'
})
export class PendingPaymentsReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private feeService = inject(FeeService);
  private notification = inject(NotificationService);

  loading = signal(true);
  reportData = signal<PendingPaymentsReportData | null>(null);

  searchQuery = '';
  statusFilter = '';
  filteredRecords = signal<PendingPaymentRecord[]>([]);
  paginatedRecords = signal<PendingPaymentRecord[]>([]);

  pageSize = 10;
  currentPage = 0;
  totalElements = 0;

  displayedColumns = ['studentName', 'className', 'feeCount', 'totalFees', 'totalPaid', 'balance', 'status', 'actions'];

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PARTIAL', label: 'Partial Payment' },
    { value: 'OVERDUE', label: 'Overdue' }
  ];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.reportService.getPendingPaymentsReport().subscribe({
      next: (data) => {
        console.log('Pending payments report loaded:', data);
        this.reportData.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load pending payments report:', err);
        this.notification.error('Failed to load pending payments report');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    const data = this.reportData();
    if (!data) return;

    let filtered = data.records;

    if (this.statusFilter) {
      filtered = filtered.filter(r => r.status === this.statusFilter);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.studentName.toLowerCase().includes(query) ||
        r.studentCode.toLowerCase().includes(query) ||
        r.className.toLowerCase().includes(query)
      );
    }

    this.filteredRecords.set(filtered);
    this.totalElements = filtered.length;
    this.currentPage = 0;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedRecords.set(this.filteredRecords().slice(start, end));
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  refreshReport(): void {
    this.loadReport();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'OVERDUE': return 'warn';
      case 'PARTIAL': return 'accent';
      case 'PENDING': return 'primary';
      default: return 'primary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'OVERDUE': return 'Overdue';
      case 'PARTIAL': return 'Partial';
      case 'PENDING': return 'Pending';
      default: return status;
    }
  }

  recordPayment(record: PendingPaymentRecord): void {
    this.notification.info('Payment recording feature coming soon');
  }

  sendReminder(record: PendingPaymentRecord): void {
    this.notification.info('Sending payment reminder...');
    this.feeService.sendReminderToStudent(record.studentId).subscribe({
      next: () => {
        this.notification.success(`Payment reminder sent to ${record.studentName}'s parent`);
      },
      error: (err) => {
        console.error('Failed to send reminder:', err);
        this.notification.error('Failed to send payment reminder');
      }
    });
  }

  sendUpcomingReminders(): void {
    this.notification.info('Sending reminders for upcoming fees...');
    this.feeService.sendUpcomingReminders(7).subscribe({
      next: () => {
        this.notification.success('Payment reminders sent for fees due within 7 days');
      },
      error: (err) => {
        console.error('Failed to send reminders:', err);
        this.notification.error('Failed to send payment reminders');
      }
    });
  }
}