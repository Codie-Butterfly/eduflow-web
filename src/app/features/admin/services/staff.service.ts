import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PagedResponse, MessageResponse } from '../../../core/models';

export interface Teacher {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  hireDate?: string;
  address?: string;
  department?: string;
  qualification?: string;
  specialization?: string;
  subjects?: { id: number; name: string; code: string }[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeacherRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  hireDate?: string;
  address?: string;
  department?: string;
  qualification?: string;
  specialization?: string;
  subjectIds?: number[];
}

export interface UpdateTeacherRequest extends CreateTeacherRequest {
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/admin/staff/teachers`;

  // Mock teachers for development/fallback
  private mockTeachers: Teacher[] = [
    { id: 1, employeeId: 'EMP-001', firstName: 'John', lastName: 'Banda', fullName: 'Mr. John Banda', email: 'john.banda@school.edu', department: 'Mathematics', qualification: 'B.Ed Mathematics', active: true },
    { id: 2, employeeId: 'EMP-002', firstName: 'Grace', lastName: 'Mwanza', fullName: 'Mrs. Grace Mwanza', email: 'grace.mwanza@school.edu', department: 'Languages', qualification: 'B.A. English', active: true },
    { id: 3, employeeId: 'EMP-003', firstName: 'Peter', lastName: 'Phiri', fullName: 'Mr. Peter Phiri', email: 'peter.phiri@school.edu', department: 'Science', qualification: 'B.Sc. Physics', active: true },
    { id: 4, employeeId: 'EMP-004', firstName: 'Mary', lastName: 'Tembo', fullName: 'Mrs. Mary Tembo', email: 'mary.tembo@school.edu', department: 'Science', qualification: 'B.Sc. Chemistry', active: true },
    { id: 5, employeeId: 'EMP-005', firstName: 'David', lastName: 'Zulu', fullName: 'Mr. David Zulu', email: 'david.zulu@school.edu', department: 'Commerce', qualification: 'B.Com', active: true },
    { id: 6, employeeId: 'EMP-006', firstName: 'Sarah', lastName: 'Mulenga', fullName: 'Mrs. Sarah Mulenga', email: 'sarah.mulenga@school.edu', department: 'Science', qualification: 'B.Sc. Biology', active: true },
    { id: 7, employeeId: 'EMP-007', firstName: 'James', lastName: 'Musonda', fullName: 'Mr. James Musonda', email: 'james.musonda@school.edu', department: 'Science', qualification: 'M.Sc. Physics', active: true },
    { id: 8, employeeId: 'EMP-008', firstName: 'Linda', lastName: 'Chanda', fullName: 'Mrs. Linda Chanda', email: 'linda.chanda@school.edu', department: 'Humanities', qualification: 'B.A. History', active: true }
  ];

  // List all teachers
  getTeachers(): Observable<Teacher[]> {
    console.log('Fetching teachers from:', this.baseUrl);
    return this.http.get<any>(this.baseUrl).pipe(
      map(response => {
        console.log('Teachers API response:', response);
        // Handle paginated response
        if (response.content) {
          return response.content.map((t: any) => this.transformTeacher(t));
        }
        // Handle array response
        if (Array.isArray(response)) {
          return response.map((t: any) => this.transformTeacher(t));
        }
        return [];
      }),
      catchError((error) => {
        console.error('Failed to fetch teachers:', error);
        return of(this.mockTeachers.filter(t => t.active));
      })
    );
  }

  private transformTeacher(data: any): Teacher {
    return {
      id: data.id,
      employeeId: data.employeeId || data.employee_id,
      firstName: data.firstName || data.first_name,
      lastName: data.lastName || data.last_name,
      fullName: data.fullName || data.full_name || data.name || `${data.firstName || data.first_name} ${data.lastName || data.last_name}`,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth || data.date_of_birth,
      hireDate: data.hireDate || data.hire_date,
      department: data.department,
      qualification: data.qualification,
      specialization: data.specialization,
      subjects: data.subjects,
      active: data.active ?? true,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at
    };
  }

  // Get teacher by ID
  getTeacherById(id: number): Observable<Teacher> {
    return this.http.get<Teacher>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => {
        const teacher = this.mockTeachers.find(t => t.id === id);
        if (teacher) return of(teacher);
        throw new Error('Teacher not found');
      })
    );
  }

  // Get teacher by employee ID
  getTeacherByEmployeeId(employeeId: string): Observable<Teacher> {
    return this.http.get<Teacher>(`${this.baseUrl}/employee-id/${employeeId}`).pipe(
      catchError(() => {
        const teacher = this.mockTeachers.find(t => t.employeeId === employeeId);
        if (teacher) return of(teacher);
        throw new Error('Teacher not found');
      })
    );
  }

  // Search teachers by name
  searchTeachers(name: string): Observable<Teacher[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<Teacher[]>(`${this.baseUrl}/search`, { params }).pipe(
      catchError(() => {
        const searchLower = name.toLowerCase();
        return of(this.mockTeachers.filter(t =>
          t.fullName.toLowerCase().includes(searchLower) ||
          t.firstName.toLowerCase().includes(searchLower) ||
          t.lastName.toLowerCase().includes(searchLower)
        ));
      })
    );
  }

  // Create teacher
  createTeacher(data: CreateTeacherRequest): Observable<Teacher> {
    return this.http.post<Teacher>(this.baseUrl, data);
  }

  // Update teacher
  updateTeacher(id: number, data: UpdateTeacherRequest): Observable<Teacher> {
    return this.http.put<Teacher>(`${this.baseUrl}/${id}`, data);
  }

  // Deactivate teacher
  deleteTeacher(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`);
  }

  // Add subject to teacher
  addSubjectToTeacher(teacherId: number, subjectId: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/${teacherId}/subjects/${subjectId}`, {});
  }

  // Remove subject from teacher
  removeSubjectFromTeacher(teacherId: number, subjectId: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${teacherId}/subjects/${subjectId}`);
  }
}