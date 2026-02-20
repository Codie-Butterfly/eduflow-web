import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  SchoolClass,
  CreateClassRequest,
  UpdateClassRequest,
  PagedResponse,
  MessageResponse,
  Student
} from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/admin/classes`;

  // Mock data for development/fallback
  private mockClasses: SchoolClass[] = [
    {
      id: 1, name: 'Grade 8A', grade: 8, section: 'A', academicYear: '2024',
      capacity: 40, studentCount: 35, active: true,
      classTeacher: { id: 1, name: 'Mr. John Banda', email: 'john.banda@school.edu' },
      subjects: ['Mathematics', 'English', 'Science', 'Social Studies', 'ICT'],
      description: 'Grade 8 Section A - Morning shift'
    },
    {
      id: 2, name: 'Grade 7B', grade: 7, section: 'B', academicYear: '2024',
      capacity: 38, studentCount: 32, active: true,
      classTeacher: { id: 2, name: 'Mrs. Grace Mwanza', email: 'grace.mwanza@school.edu' },
      subjects: ['Mathematics', 'English', 'Science', 'Social Studies'],
      description: 'Grade 7 Section B - Morning shift'
    },
    {
      id: 3, name: 'Grade 9A', grade: 9, section: 'A', academicYear: '2024',
      capacity: 35, studentCount: 30, active: true,
      classTeacher: { id: 3, name: 'Mr. Peter Phiri', email: 'peter.phiri@school.edu' },
      subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'ICT'],
      description: 'Grade 9 Section A - Science stream'
    },
    {
      id: 4, name: 'Grade 10A', grade: 10, section: 'A', academicYear: '2024',
      capacity: 35, studentCount: 28, active: true,
      classTeacher: { id: 4, name: 'Mrs. Mary Tembo', email: 'mary.tembo@school.edu' },
      subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'],
      description: 'Grade 10 Section A - Science stream'
    },
    {
      id: 5, name: 'Grade 10B', grade: 10, section: 'B', academicYear: '2024',
      capacity: 35, studentCount: 25, active: true,
      classTeacher: { id: 5, name: 'Mr. David Zulu', email: 'david.zulu@school.edu' },
      subjects: ['Mathematics', 'English', 'Commerce', 'Accounts', 'Economics'],
      description: 'Grade 10 Section B - Commerce stream'
    },
    {
      id: 6, name: 'Grade 11A', grade: 11, section: 'A', academicYear: '2024',
      capacity: 30, studentCount: 27, active: true,
      classTeacher: { id: 6, name: 'Mrs. Sarah Mulenga', email: 'sarah.mulenga@school.edu' },
      subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'],
      description: 'Grade 11 Section A - Science stream'
    },
    {
      id: 7, name: 'Grade 12A', grade: 12, section: 'A', academicYear: '2024',
      capacity: 30, studentCount: 22, active: true,
      classTeacher: { id: 7, name: 'Mr. James Musonda', email: 'james.musonda@school.edu' },
      subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'],
      description: 'Grade 12 Section A - Final year science'
    },
    {
      id: 8, name: 'Grade 8B', grade: 8, section: 'B', academicYear: '2024',
      capacity: 40, studentCount: 38, active: true,
      classTeacher: { id: 8, name: 'Mrs. Linda Chanda', email: 'linda.chanda@school.edu' },
      subjects: ['Mathematics', 'English', 'Science', 'Social Studies', 'ICT'],
      description: 'Grade 8 Section B - Afternoon shift'
    }
  ];

  getClasses(page: number = 0, size: number = 10, academicYear?: string, grade?: number): Observable<PagedResponse<SchoolClass>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (academicYear) {
      params = params.set('academicYear', academicYear);
    }
    if (grade) {
      params = params.set('grade', grade.toString());
    }

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(response => {
        const paged = this.transformPagedResponse<any>(response);
        return {
          ...paged,
          content: paged.content.map((c: any) => this.transformClass(c))
        };
      }),
      catchError(() => of(this.getMockClasses(page, size, academicYear, grade)))
    );
  }

  private getMockClasses(page: number, size: number, academicYear?: string, grade?: number): PagedResponse<SchoolClass> {
    let filtered = [...this.mockClasses];

    if (academicYear) {
      filtered = filtered.filter(c => c.academicYear === academicYear);
    }
    if (grade) {
      filtered = filtered.filter(c => c.grade === grade);
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

  getClassById(id: number): Observable<SchoolClass> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(response => this.transformClass(response)),
      catchError(() => {
        const cls = this.mockClasses.find(c => c.id === id);
        if (cls) return of(cls);
        throw new Error('Class not found');
      })
    );
  }

  getClassesByAcademicYear(year: string): Observable<SchoolClass[]> {
    return this.http.get<SchoolClass[]>(`${this.baseUrl}/academic-year/${year}`).pipe(
      catchError(() => of(this.mockClasses.filter(c => c.academicYear === year)))
    );
  }

  getClassesByGrade(grade: number): Observable<SchoolClass[]> {
    return this.http.get<SchoolClass[]>(`${this.baseUrl}/grade/${grade}`).pipe(
      catchError(() => of(this.mockClasses.filter(c => c.grade === grade)))
    );
  }

  createClass(data: CreateClassRequest): Observable<SchoolClass> {
    return this.http.post<SchoolClass>(this.baseUrl, data);
  }

  updateClass(id: number, data: UpdateClassRequest): Observable<SchoolClass> {
    return this.http.put<SchoolClass>(`${this.baseUrl}/${id}`, data);
  }

  deleteClass(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`);
  }

  getClassStudents(classId: number): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.baseUrl}/${classId}/students`).pipe(
      catchError(() => of([]))
    );
  }

  assignStudentToClass(classId: number, studentId: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/${classId}/students/${studentId}`, {});
  }

  removeStudentFromClass(classId: number, studentId: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${classId}/students/${studentId}`);
  }

  // Subject management
  addSubjectToClass(classId: number, subjectId: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/${classId}/subjects/${subjectId}`, {});
  }

  removeSubjectFromClass(classId: number, subjectId: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${classId}/subjects/${subjectId}`);
  }

  private transformClass(data: any): SchoolClass {
    const teacher = data.classTeacher || data.class_teacher;
    return {
      id: data.id,
      name: data.name,
      grade: data.grade,
      section: data.section,
      academicYear: data.academicYear || data.academic_year,
      capacity: data.capacity,
      studentCount: data.studentCount || data.student_count,
      classTeacher: teacher ? {
        id: teacher.id,
        name: teacher.name || teacher.fullName || `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email
      } : undefined,
      subjects: this.transformSubjects(data.subjects),
      description: data.description,
      active: data.active ?? true,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at
    };
  }

  private transformSubjects(subjects: any): string[] | undefined {
    if (!subjects || subjects.length === 0) return undefined;
    // If subjects are objects, extract names
    if (typeof subjects[0] === 'object') {
      return subjects.map((s: any) => s.name);
    }
    // If subjects are already strings
    return subjects;
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