import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Subject,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  PagedResponse,
  MessageResponse
} from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/admin/subjects`;

  // Mock data for development/fallback
  private mockSubjects: Subject[] = [
    { id: 1, name: 'Mathematics', code: 'MATH', department: 'Science', credits: 4, active: true, description: 'Core mathematics curriculum' },
    { id: 2, name: 'English Language', code: 'ENG', department: 'Languages', credits: 4, active: true, description: 'English language and literature' },
    { id: 3, name: 'Physics', code: 'PHY', department: 'Science', credits: 3, active: true, description: 'Physical sciences' },
    { id: 4, name: 'Chemistry', code: 'CHEM', department: 'Science', credits: 3, active: true, description: 'Chemical sciences' },
    { id: 5, name: 'Biology', code: 'BIO', department: 'Science', credits: 3, active: true, description: 'Life sciences' },
    { id: 6, name: 'History', code: 'HIST', department: 'Humanities', credits: 2, active: true, description: 'World and local history' },
    { id: 7, name: 'Geography', code: 'GEO', department: 'Humanities', credits: 2, active: true, description: 'Physical and human geography' },
    { id: 8, name: 'Computer Science', code: 'CS', department: 'Technology', credits: 3, active: true, description: 'Information and computer technology' },
    { id: 9, name: 'French', code: 'FRE', department: 'Languages', credits: 2, active: true, description: 'French language' },
    { id: 10, name: 'Physical Education', code: 'PE', department: 'Sports', credits: 1, active: true, description: 'Physical education and sports' },
    { id: 11, name: 'Art', code: 'ART', department: 'Arts', credits: 1, active: true, description: 'Visual arts and design' },
    { id: 12, name: 'Music', code: 'MUS', department: 'Arts', credits: 1, active: true, description: 'Music theory and practice' }
  ];

  getSubjects(page: number = 0, size: number = 10, search?: string): Observable<PagedResponse<Subject>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(response => this.transformPagedResponse<Subject>(response)),
      catchError(() => of(this.getMockSubjects(page, size, search)))
    );
  }

  private getMockSubjects(page: number, size: number, search?: string): PagedResponse<Subject> {
    let filtered = [...this.mockSubjects];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.code.toLowerCase().includes(searchLower)
      );
    }

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

  getAllSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.baseUrl}/all`).pipe(
      catchError(() => of(this.mockSubjects.filter(s => s.active)))
    );
  }

  getSubjectById(id: number): Observable<Subject> {
    return this.http.get<Subject>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => {
        const subject = this.mockSubjects.find(s => s.id === id);
        if (subject) return of(subject);
        throw new Error('Subject not found');
      })
    );
  }

  createSubject(data: CreateSubjectRequest): Observable<Subject> {
    return this.http.post<Subject>(this.baseUrl, data);
  }

  updateSubject(id: number, data: UpdateSubjectRequest): Observable<Subject> {
    return this.http.put<Subject>(`${this.baseUrl}/${id}`, data);
  }

  deleteSubject(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`);
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