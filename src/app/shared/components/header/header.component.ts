import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService, InAppNotificationService, InAppNotification } from '../../../core/services';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    DatePipe
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(InAppNotificationService);

  title = input<string>('EduFlow');
  toggleSidebar = output<void>();

  currentUser = this.authService.currentUser;
  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    // Load recent notifications (last 24 hours) - both read and unread
    this.notificationService.getRecentNotifications().subscribe();
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  markAsRead(notification: InAppNotification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  getNotificationIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type);
  }

  logout(): void {
    this.authService.logout();
  }
}