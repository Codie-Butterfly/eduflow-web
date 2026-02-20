import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../../../core/models';

export interface StaffMember {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  department?: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/admin/staff`;

  // Mock teachers for development/fallback
  private mockTeachers: StaffMember[] = [
    { id: 1, firstName: 'John', lastName: 'Banda', fullName: 'Mr. John Banda', email: 'john.banda@school.edu', role: 'TEACHER', department: 'Mathematics', active: true },
    { id: 2, firstName: 'Grace', lastName: 'Mwanza', fullName: 'Mrs. Grace Mwanza', email: 'grace.mwanza@school.edu', role: 'TEACHER', department: 'Languages', active: true },
    { id: 3, firstName: 'Peter', lastName: 'Phiri', fullName: 'Mr. Peter Phiri', email: 'peter.phiri@school.edu', role: 'TEACHER', department: 'Science', active: true },
    { id: 4, firstName: 'Mary', lastName: 'Tembo', fullName: 'Mrs. Mary Tembo', email: 'mary.tembo@school.edu', role: 'TEACHER', department: 'Science', active: true },
    { id: 5, firstName: 'David', lastName: 'Zulu', fullName: 'Mr. David Zulu', email: 'david.zulu@school.edu', role: 'TEACHER', department: 'Commerce', active: true },
    { id: 6, firstName: 'Sarah', lastName: 'Mulenga', fullName: 'Mrs. Sarah Mulenga', email: 'sarah.mulenga@school.edu', role: 'TEACHER', department: 'Science', active: true },
    { id: 7, firstName: 'James', lastName: 'Musonda', fullName: 'Mr. James Musonda', email: 'james.musonda@school.edu', role: 'TEACHER', department: 'Science', active: true },
    { id: 8, firstName: 'Linda', lastName: 'Chanda', fullName: 'Mrs. Linda Chanda', email: 'linda.chanda@school.edu', role: 'TEACHER', department: 'Humanities', active: true }
  ];

  getTeachers(page: number = 0, size: number = 100): Observable<StaffMember[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('role', 'TEACHER');

    return this.http.get<any>(`${this.baseUrl}/teachers`, { params }).pipe(
      map(response => {
        if (response.content) {
          return response.content.filter((t: StaffMember) => t.active !== false);
        }
        if (Array.isArray(response)) {
          return response.filter((t: StaffMember) => t.active !== false);
        }
        return [];
      }),
      catchError(() => of(this.mockTeachers.filter(t => t.active)))
    );
  }

  getTeacherById(id: number): Observable<StaffMember> {
    return this.http.get<StaffMember>(`${this.baseUrl}/teachers/${id}`).pipe(
      catchError(() => {
        const teacher = this.mockTeachers.find(t => t.id === id);
        if (teacher) return of(teacher);
        throw new Error('Teacher not found');
      })
    );
  }
}