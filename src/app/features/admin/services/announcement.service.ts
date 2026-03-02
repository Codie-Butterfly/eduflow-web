import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Announcement,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  PagedResponse,
  MessageResponse
} from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/admin/announcements`;

  // Mock data for development/fallback
  private mockAnnouncements: Announcement[] = [
    {
      id: 1,
      title: 'School Closure for Independence Day',
      content: 'The school will be closed on October 24th for Independence Day celebrations. Classes will resume on October 25th. We encourage all families to participate in local community events.',
      priority: 'HIGH',
      status: 'PUBLISHED',
      recipientType: 'ALL_STUDENTS',
      readCount: 145,
      totalRecipients: 200,
      publishedAt: '2024-10-20T09:00:00',
      createdBy: 'Admin User',
      createdById: 1,
      createdAt: '2024-10-19T14:30:00',
      updatedAt: '2024-10-20T09:00:00'
    },
    {
      id: 2,
      title: 'Parent-Teacher Conference Schedule',
      content: 'We are pleased to announce that the Parent-Teacher conferences will be held on November 15-16, 2024. Please book your preferred time slot through the school portal or contact the administration office.',
      priority: 'NORMAL',
      status: 'PUBLISHED',
      recipientType: 'ALL_PARENTS',
      readCount: 89,
      totalRecipients: 150,
      publishedAt: '2024-10-18T10:00:00',
      createdBy: 'Admin User',
      createdById: 1,
      createdAt: '2024-10-17T16:00:00',
      updatedAt: '2024-10-18T10:00:00'
    },
    {
      id: 3,
      title: 'Staff Meeting - Important Updates',
      content: 'All teaching staff are required to attend a mandatory meeting on Friday at 3:00 PM in the conference room. We will discuss the upcoming curriculum changes and examination schedules.',
      priority: 'URGENT',
      status: 'PUBLISHED',
      recipientType: 'ALL_TEACHERS',
      readCount: 25,
      totalRecipients: 30,
      publishedAt: '2024-10-21T08:00:00',
      createdBy: 'Principal',
      createdById: 2,
      createdAt: '2024-10-20T17:00:00',
      updatedAt: '2024-10-21T08:00:00'
    },
    {
      id: 4,
      title: 'Grade 8 Field Trip Information',
      content: 'Grade 8 students will be going on a field trip to the National Museum on November 5th. Please ensure permission slips are signed and returned by November 1st. Students should bring packed lunch and wear comfortable shoes.',
      priority: 'NORMAL',
      status: 'PUBLISHED',
      recipientType: 'CLASS',
      targetClasses: [{ id: 1, name: 'Grade 8A', grade: 8 }, { id: 2, name: 'Grade 8B', grade: 8 }],
      readCount: 45,
      totalRecipients: 60,
      publishedAt: '2024-10-22T11:00:00',
      attachments: [
        { id: 1, fileName: 'permission_slip.pdf', fileUrl: '/files/1', fileSize: 125000, fileType: 'application/pdf', uploadedAt: '2024-10-22T10:30:00' }
      ],
      createdBy: 'Admin User',
      createdById: 1,
      createdAt: '2024-10-22T10:30:00',
      updatedAt: '2024-10-22T11:00:00'
    },
    {
      id: 5,
      title: 'New Library Hours',
      content: 'Starting November 1st, the school library will have extended hours. New hours: Monday-Friday 7:30 AM - 6:00 PM, Saturday 9:00 AM - 1:00 PM.',
      priority: 'LOW',
      status: 'DRAFT',
      recipientType: 'ALL_STUDENTS',
      createdBy: 'Librarian',
      createdById: 3,
      createdAt: '2024-10-23T09:00:00',
      updatedAt: '2024-10-23T09:00:00'
    },
    {
      id: 6,
      title: 'Sports Day Postponement',
      content: 'Due to expected rainfall, the Sports Day event scheduled for October 30th has been postponed to November 6th. All other details remain the same.',
      priority: 'HIGH',
      status: 'ARCHIVED',
      recipientType: 'ALL_STUDENTS',
      readCount: 198,
      totalRecipients: 200,
      publishedAt: '2024-10-25T07:00:00',
      createdBy: 'Sports Coordinator',
      createdById: 4,
      createdAt: '2024-10-24T18:00:00',
      updatedAt: '2024-10-30T12:00:00'
    }
  ];

  getAnnouncements(
    page: number = 0,
    size: number = 10,
    search?: string,
    status?: string,
    priority?: string
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
    if (priority) {
      params = params.set('priority', priority);
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
        console.error('Announcements API error:', error);
        return of(this.getMockAnnouncements(page, size, search, status, priority));
      })
    );
  }

  private getMockAnnouncements(
    page: number,
    size: number,
    search?: string,
    status?: string,
    priority?: string
  ): PagedResponse<Announcement> {
    let filtered = [...this.mockAnnouncements];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(searchLower) ||
        a.content.toLowerCase().includes(searchLower)
      );
    }

    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }

    if (priority) {
      filtered = filtered.filter(a => a.priority === priority);
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || '').getTime();
      const dateB = new Date(b.createdAt || '').getTime();
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

  getAnnouncementById(id: number): Observable<Announcement> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError(() => {
        const announcement = this.mockAnnouncements.find(a => a.id === id);
        if (announcement) return of(announcement);
        return throwError(() => new Error('Announcement not found'));
      })
    );
  }

  createAnnouncement(data: CreateAnnouncementRequest): Observable<Announcement> {
    return this.http.post<Announcement>(this.baseUrl, data).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError(() => {
        // Mock create for development
        const newAnnouncement: Announcement = {
          id: Math.max(...this.mockAnnouncements.map(a => a.id)) + 1,
          title: data.title,
          content: data.content,
          priority: data.priority,
          status: data.publishNow ? 'PUBLISHED' : 'DRAFT',
          recipientType: data.recipientType,
          publishedAt: data.publishNow ? new Date().toISOString() : undefined,
          expiresAt: data.expiresAt,
          createdBy: 'Current User',
          createdById: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.mockAnnouncements.unshift(newAnnouncement);
        return of(newAnnouncement);
      })
    );
  }

  updateAnnouncement(id: number, data: UpdateAnnouncementRequest): Observable<Announcement> {
    return this.http.put<Announcement>(`${this.baseUrl}/${id}`, data).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError(() => {
        // Mock update for development
        const index = this.mockAnnouncements.findIndex(a => a.id === id);
        if (index !== -1) {
          this.mockAnnouncements[index] = {
            ...this.mockAnnouncements[index],
            title: data.title,
            content: data.content,
            priority: data.priority,
            recipientType: data.recipientType,
            status: data.status || this.mockAnnouncements[index].status,
            updatedAt: new Date().toISOString()
          };
          return of(this.mockAnnouncements[index]);
        }
        return throwError(() => new Error('Announcement not found'));
      })
    );
  }

  deleteAnnouncement(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => {
        // Mock delete for development
        const index = this.mockAnnouncements.findIndex(a => a.id === id);
        if (index !== -1) {
          this.mockAnnouncements.splice(index, 1);
        }
        return of({ message: 'Announcement deleted successfully', success: true });
      })
    );
  }

  publishAnnouncement(id: number): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.baseUrl}/${id}/publish`, {}).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError(() => {
        // Mock publish for development
        const announcement = this.mockAnnouncements.find(a => a.id === id);
        if (announcement) {
          announcement.status = 'PUBLISHED';
          announcement.publishedAt = new Date().toISOString();
          announcement.updatedAt = new Date().toISOString();
          return of(announcement);
        }
        return throwError(() => new Error('Announcement not found'));
      })
    );
  }

  archiveAnnouncement(id: number): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.baseUrl}/${id}/archive`, {}).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError(() => {
        // Mock archive for development
        const announcement = this.mockAnnouncements.find(a => a.id === id);
        if (announcement) {
          announcement.status = 'ARCHIVED';
          announcement.updatedAt = new Date().toISOString();
          return of(announcement);
        }
        return throwError(() => new Error('Announcement not found'));
      })
    );
  }

  private transformAnnouncement(data: any): Announcement {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      priority: data.priority,
      status: data.status,
      recipientType: data.recipientType || data.recipient_type,
      targetClasses: data.targetClasses || data.target_classes,
      targetRecipients: data.targetRecipients || data.target_recipients,
      attachments: data.attachments,
      readCount: data.readCount || data.read_count || 0,
      totalRecipients: data.totalRecipients || data.total_recipients || 0,
      publishedAt: data.publishedAt || data.published_at,
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

    if (response.data !== undefined) {
      const data = Array.isArray(response.data) ? response.data : [];
      return {
        content: data,
        page: response.page ?? response.number ?? 0,
        size: response.size ?? data.length,
        totalElements: response.totalElements ?? response.total ?? data.length,
        totalPages: response.totalPages ?? 1,
        first: response.first ?? true,
        last: response.last ?? true
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
