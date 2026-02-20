import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { ParentService, ChildSummary } from '../services/parent.service';

@Component({
  selector: 'app-children-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    CurrencyPipe
  ],
  templateUrl: './children-list.component.html',
  styleUrl: './children-list.component.scss'
})
export class ChildrenListComponent implements OnInit {
  private parentService = inject(ParentService);

  isLoading = signal(true);
  children = signal<ChildSummary[]>([]);

  ngOnInit(): void {
    this.loadChildren();
  }

  private loadChildren(): void {
    this.isLoading.set(true);
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

  getStatusColor(balance: number): string {
    return balance === 0 ? 'primary' : 'warn';
  }

  getPaymentProgress(paid: number, total: number): number {
    if (total === 0) return 100;
    return Math.round((paid / total) * 100);
  }
}