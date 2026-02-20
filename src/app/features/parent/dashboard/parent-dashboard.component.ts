import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { ParentService, ChildSummary, ParentDashboardStats } from '../services/parent.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    CurrencyPipe,
    DatePipe,
    StatCardComponent
  ],
  templateUrl: './parent-dashboard.component.html',
  styleUrl: './parent-dashboard.component.scss'
})
export class ParentDashboardComponent implements OnInit {
  private parentService = inject(ParentService);

  isLoading = signal(true);
  stats = signal<ParentDashboardStats | null>(null);
  children = signal<ChildSummary[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);

    // Load stats
    this.parentService.getDashboardStats().subscribe({
      next: (data) => this.stats.set(data),
      error: () => console.error('Failed to load stats')
    });

    // Load children
    this.parentService.getChildren().subscribe({
      next: (data) => {
        this.children.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getStatusColor(pendingFees: number, balance: number): string {
    if (balance === 0) return 'primary';
    if (pendingFees > 0) return 'warn';
    return 'accent';
  }

  getStatusLabel(balance: number): string {
    if (balance === 0) return 'Fully Paid';
    return 'Balance Due';
  }
}