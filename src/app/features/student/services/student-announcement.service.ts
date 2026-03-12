import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Announcement,
  PagedResponse,
  MessageResponse
} from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class StudentAnnouncementService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/student/announcements`;

  /**
   * Get announcements for the current student (paginated)
   */
  getAnnouncements(
    page: number = 0,
    size: number = 10,
    unreadOnly: boolean = false
  ): Observable<PagedResponse<Announcement & { isRead: boolean }>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (unreadOnly) {
      params = params.set('unreadOnly', 'true');
    }

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(response => {
        const paged = this.transformPagedResponse<any>(response);
        return {
          ...paged,
          content: paged.content.map((a: any) => this.transformAnnouncement(a))
        };
      }),
      catchError((error) => {
        console.error('Student announcements API error:', error);
        return of({
          content: [],
          page: 0,
          size: 10,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true
        });
      })
    );
  }

  /**
   * Get a single announcement by ID
   */
  getAnnouncementById(id: number): Observable<Announcement & { isRead: boolean }> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError((error) => {
        console.error('Failed to get announcement:', error);
        return throwError(() => new Error('Announcement not found'));
      })
    );
  }

  /**
   * Mark an announcement as read
   */
  markAsRead(id: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/${id}/read`, {}).pipe(
      map(response => {
        console.log('Successfully marked announcement as read:', id, response);
        return { message: 'Marked as read', success: true };
      }),
      catchError((error) => {
        console.error('Failed to mark announcement as read:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get count of unread announcements
   */
  getUnreadCount(): Observable<number> {
    return this.http.get<any>(`${this.baseUrl}/unread-count`).pipe(
      map(response => {
        return typeof response === 'number' ? response : (response.count || response.unreadCount || 0);
      }),
      catchError((error) => {
        console.error('Failed to get unread count:', error);
        return of(0);
      })
    );
  }

  private transformAnnouncement(data: any): Announcement & { isRead: boolean } {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      priority: data.priority,
      status: data.status,
      targetType: data.targetType || data.target_type,
      recipientType: data.recipientType || data.recipient_type,
      targetClasses: data.targetClasses || data.target_classes,
      attachments: data.attachments,
      publishedAt: data.publishedAt || data.published_at,
      scheduledAt: data.scheduledAt || data.scheduled_at,
      expiresAt: data.expiresAt || data.expires_at,
      createdBy: data.createdBy || data.created_by,
      createdAt: data.createdAt || data.created_at,
      isRead: data.isRead ?? data.is_read ?? data.read ?? false
    };
  }

  private transformPagedResponse<T>(response: any): PagedResponse<T> {
    if (response.content !== undefined) {
      return {
        content: response.content || [],
        page: response.page ?? response.number ?? 0,
        size: response.size ?? 10,
        totalElements: response.totalElements ?? 0,
        totalPages: response.totalPages ?? 0,
        first: response.first ?? true,
        last: response.last ?? true
      };
    }

    if (Array.isArray(response)) {
      return {
        content: response,
        page: 0,
        size: response.length,
        totalElements: response.length,
        totalPages: 1,
        first: true,
        last: true
      };
    }

    return {
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true
    };
  }
}