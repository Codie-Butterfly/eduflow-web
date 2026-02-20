import { Component, input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, CurrencyPipe],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss'
})
export class StatCardComponent {
  title = input.required<string>();
  value = input.required<string | number>();
  icon = input<string>('analytics');
  trend = input<number | null>(null);
  trendLabel = input<string>('vs last month');
  color = input<'primary' | 'success' | 'warning' | 'error'>('primary');
  isCurrency = input<boolean>(false);
}