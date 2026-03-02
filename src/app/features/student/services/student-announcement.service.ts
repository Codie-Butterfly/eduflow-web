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

  // Mock data for development/fallback
  private mockAnnouncements: (Announcement & { isRead: boolean })[] = [
    {
      id: 1,
      title: 'School Closure for Independence Day',
      content: 'The school will be closed on October 24th for Independence Day celebrations. Classes will resume on October 25th. We encourage all families to participate in local community events.',
      priority: 'HIGH',
      status: 'PUBLISHED',
      recipientType: 'ALL_STUDENTS',
      publishedAt: '2024-10-20T09:00:00',
      createdBy: 'Admin',
      createdAt: '2024-10-19T14:30:00',
      isRead: true
    },
    {
      id: 4,
      title: 'Grade 8A Field Trip Information',
      content: 'Grade 8 students will be going on a field trip to the National Museum on November 5th. Please ensure permission slips are signed and returned by November 1st. Students should bring packed lunch and wear comfortable shoes.',
      priority: 'NORMAL',
      status: 'PUBLISHED',
      recipientType: 'CLASS',
      targetClasses: [{ id: 1, name: 'Grade 8A', grade: 8 }],
      publishedAt: '2024-10-22T11:00:00',
      attachments: [
        { id: 1, fileName: 'permission_slip.pdf', fileUrl: '/files/1', fileSize: 125000, fileType: 'application/pdf', uploadedAt: '2024-10-22T10:30:00' }
      ],
      createdBy: 'Admin',
      createdAt: '2024-10-22T10:30:00',
      isRead: false
    },
    {
      id: 101,
      title: 'Grade 8A Homework Reminder',
      content: 'Please remember to submit your science project by Friday. You should include a working model and a written report explaining your hypothesis and results.',
      priority: 'NORMAL',
      status: 'PUBLISHED',
      recipientType: 'CLASS',
      targetClasses: [{ id: 1, name: 'Grade 8A', grade: 8 }],
      publishedAt: '2024-10-21T10:00:00',
      createdBy: 'Mr. John Banda',
      createdAt: '2024-10-21T09:30:00',
      isRead: true
    },
    {
      id: 102,
      title: 'Extra Math Class This Saturday',
      content: 'For students who need additional help with algebra, I will be holding an extra class this Saturday from 9 AM to 11 AM in Room 203. Please inform your parents.',
      priority: 'HIGH',
      status: 'PUBLISHED',
      recipientType: 'CLASS',
      targetClasses: [{ id: 1, name: 'Grade 8A', grade: 8 }],
      publishedAt: '2024-10-22T08:00:00',
      createdBy: 'Mr. John Banda',
      createdAt: '2024-10-21T16:00:00',
      isRead: false
    }
  ];

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
        return of(this.getMockAnnouncements(page, size, unreadOnly));
      })
    );
  }

  private getMockAnnouncements(
    page: number,
    size: number,
    unreadOnly: boolean
  ): PagedResponse<Announcement & { isRead: boolean }> {
    let filtered = [...this.mockAnnouncements];

    if (unreadOnly) {
      filtered = filtered.filter(a => !a.isRead);
    }

    // Sort by publishedAt descending
    filtered.sort((a, b) => {
      const dateA = new Date(a.publishedAt || '').getTime();
      const dateB = new Date(b.publishedAt || '').getTime();
      return dateB - dateA;
    });

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

    return {
      content,
      page,
      size,
      totalElements,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1
    };
  }

  /**
   * Get a single announcement by ID
   */
  getAnnouncementById(id: number): Observable<Announcement & { isRead: boolean }> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError(() => {
        const announcement = this.mockAnnouncements.find(a => a.id === id);
        if (announcement) return of(announcement);
        return throwError(() => new Error('Announcement not found'));
      })
    );
  }

  /**
   * Mark an announcement as read
   */
  markAsRead(id: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/${id}/read`, {}).pipe(
      catchError(() => {
        // Mock marking as read
        const announcement = this.mockAnnouncements.find(a => a.id === id);
        if (announcement) {
          announcement.isRead = true;
        }
        return of({ message: 'Marked as read', success: true });
      })
    );
  }

  /**
   * Get count of unread announcements
   */
  getUnreadCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/unread-count`).pipe(
      map(response => response.count),
      catchError(() => {
        const count = this.mockAnnouncements.filter(a => !a.isRead).length;
        return of(count);
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
      recipientType: data.recipientType || data.recipient_type,
      targetClasses: data.targetClasses || data.target_classes,
      attachments: data.attachments,
      publishedAt: data.publishedAt || data.published_at,
      expiresAt: data.expiresAt || data.expires_at,
      createdBy: data.createdBy || data.created_by,
      createdAt: data.createdAt || data.created_at,
      isRead: data.isRead ?? data.is_read ?? false
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
