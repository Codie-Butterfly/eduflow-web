import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Announcement,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  PagedResponse,
  MessageResponse,
  SchoolClass
} from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class TeacherAnnouncementService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/teacher/announcements`;
  private readonly classesUrl = `${environment.apiUrl}/v1/teacher/classes`;

  /**
   * Get teacher's own announcements (created by this teacher)
   */
  getMyAnnouncements(
    page: number = 0,
    size: number = 10,
    search?: string,
    status?: string
  ): Observable<PagedResponse<Announcement>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (status) {
      params = params.set('status', status);
    }

    // Use /my endpoint to get announcements created by this teacher
    return this.http.get<any>(`${this.baseUrl}/my`, { params }).pipe(
      map(response => {
        const paged = this.transformPagedResponse<any>(response);
        return {
          ...paged,
          content: paged.content.map((a: any) => this.transformAnnouncement(a))
        };
      }),
      catchError((error) => {
        console.error('Teacher announcements API error:', error);
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
  getAnnouncementById(id: number): Observable<Announcement> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError((error) => {
        console.error('Failed to get announcement:', error);
        return throwError(() => new Error('Announcement not found'));
      })
    );
  }

  /**
   * Get teacher's assigned classes
   */
  getMyClasses(): Observable<SchoolClass[]> {
    return this.http.get<any>(this.classesUrl).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        if (response.content) {
          return response.content;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Failed to get classes:', error);
        return of([]);
      })
    );
  }

  /**
   * Create a new announcement
   */
  createAnnouncement(data: CreateAnnouncementRequest): Observable<Announcement> {
    return this.http.post<Announcement>(this.baseUrl, data).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError((error) => {
        console.error('Failed to create announcement:', error);
        return throwError(() => new Error('Failed to create announcement'));
      })
    );
  }

  /**
   * Update an existing announcement
   */
  updateAnnouncement(id: number, data: UpdateAnnouncementRequest): Observable<Announcement> {
    return this.http.put<Announcement>(`${this.baseUrl}/${id}`, data).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError((error) => {
        console.error('Failed to update announcement:', error);
        return throwError(() => new Error('Failed to update announcement'));
      })
    );
  }

  /**
   * Delete an announcement
   */
  deleteAnnouncement(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`).pipe(
      catchError((error) => {
        console.error('Failed to delete announcement:', error);
        return of({ message: 'Failed to delete announcement', success: false });
      })
    );
  }

  /**
   * Publish an announcement
   */
  publishAnnouncement(id: number): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.baseUrl}/${id}/publish`, {}).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError((error) => {
        console.error('Failed to publish announcement:', error);
        return throwError(() => new Error('Failed to publish announcement'));
      })
    );
  }

  // ============ INBOX METHODS (for announcements sent TO the teacher) ============

  /**
   * Get announcements targeted to this teacher (inbox)
   */
  getInboxAnnouncements(
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

    // Use /inbox endpoint to get announcements sent to this teacher
    return this.http.get<any>(`${this.baseUrl}/inbox`, { params }).pipe(
      map(response => {
        const paged = this.transformPagedResponse<any>(response);
        return {
          ...paged,
          content: paged.content.map((a: any) => this.transformInboxAnnouncement(a))
        };
      }),
      catchError((error) => {
        console.error('Teacher inbox announcements API error:', error);
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

  private transformInboxAnnouncement(data: any): Announcement & { isRead: boolean } {
    return {
      ...this.transformAnnouncement(data),
      isRead: data.isRead ?? data.is_read ?? data.read ?? false
    };
  }

  private transformAnnouncement(data: any): Announcement {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      priority: data.priority,
      status: data.status,
      targetType: data.targetType || data.target_type,
      recipientType: data.recipientType || data.recipient_type,
      targetClasses: data.targetClasses || data.target_classes,
      targetRecipients: data.targetRecipients || data.target_recipients,
      targetClassIds: data.targetClassIds || data.target_class_ids,
      targetUserIds: data.targetUserIds || data.target_user_ids,
      targetGrades: data.targetGrades || data.target_grades,
      targetIds: data.targetIds || data.target_ids,
      attachments: data.attachments,
      readCount: data.readCount || data.read_count || 0,
      totalRecipients: data.totalRecipients || data.total_recipients || 0,
      publishedAt: data.publishedAt || data.published_at,
      scheduledAt: data.scheduledAt || data.scheduled_at,
      expiresAt: data.expiresAt || data.expires_at,
      createdBy: data.createdBy || data.created_by,
      createdById: data.createdById || data.created_by_id,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at
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