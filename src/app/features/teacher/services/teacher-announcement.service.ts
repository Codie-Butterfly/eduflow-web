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

  // Mock data for development/fallback
  private mockAnnouncements: Announcement[] = [
    {
      id: 101,
      title: 'Grade 8A Homework Reminder',
      content: 'Please remember to submit your science project by Friday. You should include a working model and a written report explaining your hypothesis and results.',
      priority: 'NORMAL',
      status: 'PUBLISHED',
      recipientType: 'CLASS',
      targetClasses: [{ id: 1, name: 'Grade 8A', grade: 8 }],
      readCount: 28,
      totalRecipients: 35,
      publishedAt: '2024-10-21T10:00:00',
      createdBy: 'Mr. John Banda',
      createdById: 1,
      createdAt: '2024-10-21T09:30:00',
      updatedAt: '2024-10-21T10:00:00'
    },
    {
      id: 102,
      title: 'Extra Math Class This Saturday',
      content: 'For students who need additional help with algebra, I will be holding an extra class this Saturday from 9 AM to 11 AM in Room 203. Please inform your parents.',
      priority: 'HIGH',
      status: 'PUBLISHED',
      recipientType: 'CLASS',
      targetClasses: [{ id: 1, name: 'Grade 8A', grade: 8 }, { id: 2, name: 'Grade 8B', grade: 8 }],
      readCount: 55,
      totalRecipients: 70,
      publishedAt: '2024-10-22T08:00:00',
      createdBy: 'Mr. John Banda',
      createdById: 1,
      createdAt: '2024-10-21T16:00:00',
      updatedAt: '2024-10-22T08:00:00'
    },
    {
      id: 103,
      title: 'Test Preparation Tips',
      content: 'The mid-term tests are approaching. Please review chapters 5-8 and complete all practice exercises. Study groups are encouraged.',
      priority: 'NORMAL',
      status: 'DRAFT',
      recipientType: 'CLASS',
      targetClasses: [{ id: 1, name: 'Grade 8A', grade: 8 }],
      createdBy: 'Mr. John Banda',
      createdById: 1,
      createdAt: '2024-10-23T14:00:00',
      updatedAt: '2024-10-23T14:00:00'
    }
  ];

  private mockClasses: SchoolClass[] = [
    {
      id: 1, name: 'Grade 8A', grade: 8, section: 'A', academicYear: '2024',
      capacity: 40, studentCount: 35, active: true
    },
    {
      id: 2, name: 'Grade 8B', grade: 8, section: 'B', academicYear: '2024',
      capacity: 40, studentCount: 38, active: true
    },
    {
      id: 3, name: 'Grade 9A', grade: 9, section: 'A', academicYear: '2024',
      capacity: 35, studentCount: 30, active: true
    }
  ];

  /**
   * Get teacher's own announcements (paginated)
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

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(response => {
        const paged = this.transformPagedResponse<any>(response);
        return {
          ...paged,
          content: paged.content.map((a: any) => this.transformAnnouncement(a))
        };
      }),
      catchError((error) => {
        console.error('Teacher announcements API error:', error);
        return of(this.getMockAnnouncements(page, size, search, status));
      })
    );
  }

  private getMockAnnouncements(
    page: number,
    size: number,
    search?: string,
    status?: string
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

  /**
   * Get a single announcement by ID
   */
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
      catchError(() => of(this.mockClasses))
    );
  }

  /**
   * Create a new announcement
   */
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
          targetClasses: data.targetClassIds?.map(id => {
            const cls = this.mockClasses.find(c => c.id === id);
            return cls ? { id: cls.id, name: cls.name, grade: cls.grade } : { id, name: `Class ${id}` };
          }),
          publishedAt: data.publishNow ? new Date().toISOString() : undefined,
          expiresAt: data.expiresAt,
          createdBy: 'Current Teacher',
          createdById: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.mockAnnouncements.unshift(newAnnouncement);
        return of(newAnnouncement);
      })
    );
  }

  /**
   * Update an existing announcement
   */
  updateAnnouncement(id: number, data: UpdateAnnouncementRequest): Observable<Announcement> {
    return this.http.put<Announcement>(`${this.baseUrl}/${id}`, data).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError(() => {
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

  /**
   * Delete an announcement
   */
  deleteAnnouncement(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => {
        const index = this.mockAnnouncements.findIndex(a => a.id === id);
        if (index !== -1) {
          this.mockAnnouncements.splice(index, 1);
        }
        return of({ message: 'Announcement deleted successfully', success: true });
      })
    );
  }

  /**
   * Publish an announcement
   */
  publishAnnouncement(id: number): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.baseUrl}/${id}/publish`, {}).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError(() => {
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
