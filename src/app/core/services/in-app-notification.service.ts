import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InAppNotification {
  id: number;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'PAYMENT_REMINDER' | 'ANNOUNCEMENT' | 'ALERT';
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export interface PagedNotifications {
  content: InAppNotification[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class InAppNotificationService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/notifications`;

  // Reactive state for unread count
  unreadCount = signal(0);
  notifications = signal<InAppNotification[]>([]);

  getNotifications(page: number = 0, size: number = 20): Observable<PagedNotifications> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(response => this.transformResponse(response)),
      tap(result => {
        if (page === 0) {
          this.notifications.set(result.content);
        }
      }),
      catchError(error => {
        console.error('Failed to fetch notifications:', error);
        return of({
          content: [],
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0
        });
      })
    );
  }

  getUnreadNotifications(): Observable<InAppNotification[]> {
    return this.http.get<any>(`${this.baseUrl}/unread`).pipe(
      map(response => {
        const notifications = Array.isArray(response) ? response : (response.content || response.data || []);
        return notifications.map((n: any) => this.transformNotification(n));
      }),
      tap(notifications => {
        this.notifications.set(notifications);
        this.unreadCount.set(notifications.length);
      }),
      catchError(error => {
        console.error('Failed to fetch unread notifications:', error);
        return of([]);
      })
    );
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<any>(`${this.baseUrl}/unread/count`).pipe(
      map(response => {
        const count = typeof response === 'number' ? response : (response.count || response.unreadCount || 0);
        this.unreadCount.set(count);
        return count;
      }),
      catchError(() => {
        return of(0);
      })
    );
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Update local state
        this.notifications.update(notifications =>
          notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        this.unreadCount.update(count => Math.max(0, count - 1));
      }),
      catchError(error => {
        console.error('Failed to mark notification as read:', error);
        return of(void 0);
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update(notifications =>
          notifications.map(n => ({ ...n, read: true }))
        );
        this.unreadCount.set(0);
      }),
      catchError(error => {
        console.error('Failed to mark all notifications as read:', error);
        return of(void 0);
      })
    );
  }

  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${notificationId}`).pipe(
      tap(() => {
        this.notifications.update(notifications =>
          notifications.filter(n => n.id !== notificationId)
        );
      }),
      catchError(error => {
        console.error('Failed to delete notification:', error);
        return of(void 0);
      })
    );
  }

  private transformResponse(response: any): PagedNotifications {
    const content = response.content || response.data || [];
    return {
      content: content.map((n: any) => this.transformNotification(n)),
      page: response.page ?? response.number ?? 0,
      size: response.size ?? 20,
      totalElements: response.totalElements ?? content.length,
      totalPages: response.totalPages ?? 1
    };
  }

  private transformNotification(data: any): InAppNotification {
    return {
      id: data.id,
      title: data.title || data.subject || 'Notification',
      message: data.message || data.body || data.content || '',
      type: data.type || data.notificationType || 'INFO',
      read: data.read ?? data.isRead ?? false,
      createdAt: data.createdAt || data.created_at || new Date().toISOString(),
      readAt: data.readAt || data.read_at
    };
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'PAYMENT_REMINDER': return 'payment';
      case 'WARNING': return 'warning';
      case 'ANNOUNCEMENT': return 'campaign';
      case 'ALERT': return 'error';
      default: return 'notifications';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'PAYMENT_REMINDER': return 'accent';
      case 'WARNING': return 'warn';
      case 'ALERT': return 'warn';
      default: return 'primary';
    }
  }
}
