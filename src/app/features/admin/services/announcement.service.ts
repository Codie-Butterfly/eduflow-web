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

  getAnnouncementById(id: number): Observable<Announcement> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError((error) => {
        console.error('Failed to get announcement:', error);
        return throwError(() => new Error('Announcement not found'));
      })
    );
  }

  createAnnouncement(data: CreateAnnouncementRequest): Observable<Announcement> {
    return this.http.post<Announcement>(this.baseUrl, data).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError((error) => {
        console.error('Failed to create announcement:', error);
        return throwError(() => new Error('Failed to create announcement'));
      })
    );
  }

  updateAnnouncement(id: number, data: UpdateAnnouncementRequest): Observable<Announcement> {
    return this.http.put<Announcement>(`${this.baseUrl}/${id}`, data).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError((error) => {
        console.error('Failed to update announcement:', error);
        return throwError(() => new Error('Failed to update announcement'));
      })
    );
  }

  deleteAnnouncement(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`).pipe(
      catchError((error) => {
        console.error('Failed to delete announcement:', error);
        return of({ message: 'Failed to delete announcement', success: false });
      })
    );
  }

  publishAnnouncement(id: number): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.baseUrl}/${id}/publish`, {}).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError((error) => {
        console.error('Failed to publish announcement:', error);
        return throwError(() => new Error('Failed to publish announcement'));
      })
    );
  }

  archiveAnnouncement(id: number): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.baseUrl}/${id}/archive`, {}).pipe(
      map(response => this.transformAnnouncement(response)),
      catchError((error) => {
        console.error('Failed to archive announcement:', error);
        return throwError(() => new Error('Failed to archive announcement'));
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
      targetType: data.targetType || data.target_type,
      recipientType: data.recipientType || data.recipient_type,
      targetClasses: data.targetClasses || data.target_classes,
      targetRecipients: data.targetRecipients || data.target_recipients,
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