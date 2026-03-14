import { Component, inject, input, output, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
  private router = inject(Router);

  title = input<string>('EduFlow');
  toggleSidebar = output<void>();

  currentUser = this.authService.currentUser;
  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;

  // Compute base path based on user role
  basePath = computed(() => {
    const roles = this.currentUser()?.roles || [];
    // Get primary role (without ROLE_ prefix if present)
    const primaryRole = roles[0]?.replace('ROLE_', '') || '';
    switch (primaryRole) {
      case 'ADMIN': return '/admin';
      case 'TEACHER': return '/teacher';
      case 'PARENT': return '/parent';
      case 'STUDENT': return '/student';
      default: return '';
    }
  });

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

  goToProfile(): void {
    this.router.navigate([this.basePath(), 'profile']);
  }

  goToAccount(): void {
    this.router.navigate([this.basePath(), 'account']);
  }

  logout(): void {
    this.authService.logout();
  }
}