import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, throwError, map, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Student } from '../../../core/models';

export interface TeacherClass {
  id: number;
  name: string;
  grade: number;
  section?: string;
  academicYear: string;
  studentCount: number;
  subject?: string;
  schedule?: string;
}

export interface TeacherDashboardStats {
  totalClasses: number;
  totalStudents: number;
  todayAttendance: number;
  pendingAttendance: number;
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  studentNumber: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

export interface AttendanceSummary {
  classId: number;
  className: string;
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export interface MarkAttendanceRequest {
  classId: number;
  date: string;
  records: { studentId: number; status: string; remarks?: string }[];
}

export interface AttendanceStatusResponse {
  classId: number;
  className: string;
  date: string;
  isPending: boolean;
  isCompleted: boolean;
  totalStudents: number;
}

export interface AttendanceHistoryResponse {
  classId: number;
  className: string;
  startDate: string;
  endDate: string;
  totalRecords: number;
  records: AttendanceRecord[];
}

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/teacher`;

  getDashboardStats(): Observable<TeacherDashboardStats> {
    // Get classes first, then check attendance status
    return this.getMyClasses().pipe(
      switchMap(classes => {
        if (classes.length === 0) {
          return of({
            totalClasses: 0,
            totalStudents: 0,
            todayAttendance: 0,
            pendingAttendance: 0
          });
        }

        const classIds = classes.map(c => c.id);
        const totalStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);

        // Get attendance status for all classes
        return this.getAttendanceStatus(classIds).pipe(
          map(statusList => {
            const completed = statusList.filter(s => s.isCompleted).length;
            const pending = statusList.filter(s => s.isPending).length;

            return {
              totalClasses: classes.length,
              totalStudents,
              todayAttendance: completed,
              pendingAttendance: pending
            };
          }),
          catchError(() => of({
            totalClasses: classes.length,
            totalStudents,
            todayAttendance: 0,
            pendingAttendance: classes.length
          }))
        );
      }),
      catchError(() => of({
        totalClasses: 0,
        totalStudents: 0,
        todayAttendance: 0,
        pendingAttendance: 0
      }))
    );
  }

  /**
   * Get attendance status for multiple classes (for today)
   */
  getAttendanceStatus(classIds: number[]): Observable<AttendanceStatusResponse[]> {
    // Add today's date as query parameter
    const today = new Date().toISOString().split('T')[0];
    const params = new HttpParams().set('date', today);

    console.log('Calling attendance status with classIds:', classIds, 'date:', today);

    return this.http.post<any>(`${this.baseUrl}/attendance/status`, classIds, { params }).pipe(
      map(response => {
        console.log('Attendance status raw response:', JSON.stringify(response));
        const list = Array.isArray(response) ? response : (response.content || response.data || []);

        const mapped = list.map((item: any) => {
          // Handle various field name formats - log all fields to debug
          console.log('Raw item fields:', Object.keys(item), 'values:', item);

          // Check for completion status with various field names
          const isCompleted = item.isCompleted ?? item.is_completed ?? item.completed ??
                              item.attendanceCompleted ?? item.attendance_completed ??
                              item.markedCompleted ?? item.marked_completed ??
                              item.hasAttendance ?? item.has_attendance ?? false;

          // Check for pending status with various field names
          const isPending = item.isPending ?? item.is_pending ?? item.pending ??
                            item.attendancePending ?? item.attendance_pending ??
                            item.needsAttendance ?? item.needs_attendance ??
                            !isCompleted;

          console.log(`Class ${item.classId || item.class_id}: isCompleted=${isCompleted}, isPending=${isPending}, raw completed=${item.completed}, raw isCompleted=${item.isCompleted}`);

          return {
            classId: item.classId || item.class_id,
            className: item.className || item.class_name || '',
            date: item.date,
            isPending,
            isCompleted,
            totalStudents: item.totalStudents || item.total_students || 0
          };
        });

        console.log('Mapped attendance status:', mapped);
        return mapped;
      }),
      catchError(error => {
        console.error('Failed to get attendance status:', error);
        return of([]);
      })
    );
  }

  getMyClasses(): Observable<TeacherClass[]> {
    return this.http.get<any>(`${this.baseUrl}/classes`).pipe(
      map(response => {
        const classes = Array.isArray(response) ? response : (response.content || []);
        return classes.map((c: any) => this.transformClass(c));
      }),
      catchError(error => {
        console.error('Failed to load classes:', error);
        return of([]);
      })
    );
  }

  getClassDetails(classId: number): Observable<TeacherClass> {
    return this.http.get<any>(`${this.baseUrl}/classes/${classId}`).pipe(
      map(response => this.transformClass(response)),
      catchError(() => {
        // Fallback: fetch from list and filter
        return this.getMyClasses().pipe(
          map(classes => {
            const found = classes.find(c => c.id === classId);
            if (found) return found;
            throw new Error('Class not found');
          }),
          catchError(error => {
            console.error('Failed to load class details:', error);
            return throwError(() => new Error('Class not found'));
          })
        );
      })
    );
  }

  getClassStudents(classId: number): Observable<Student[]> {
    // Try teacher endpoint first, then fall back to admin endpoint
    return this.http.get<any>(`${this.baseUrl}/classes/${classId}/students`).pipe(
      map(response => {
        console.log('Class students response:', response);
        const students = Array.isArray(response) ? response : (response.content || response.students || []);
        return students.map((s: any) => this.transformStudent(s));
      }),
      catchError(() => {
        // Fallback to admin classes endpoint
        return this.http.get<any>(`${environment.apiUrl}/v1/admin/classes/${classId}/students`).pipe(
          map(response => {
            console.log('Admin class students response:', response);
            const students = Array.isArray(response) ? response : (response.content || response.students || []);
            return students.map((s: any) => this.transformStudent(s));
          }),
          catchError(error => {
            console.error('Failed to load class students:', error);
            return of([]);
          })
        );
      })
    );
  }

  getAttendanceForDate(classId: number, date: string): Observable<AttendanceRecord[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<any>(`${this.baseUrl}/classes/${classId}/attendance`, { params }).pipe(
      map(response => {
        console.log('Attendance response:', response);
        const records = Array.isArray(response) ? response : (response.content || response.records || response.attendance || []);
        return records.map((r: any) => this.transformAttendanceRecord(r));
      }),
      catchError(error => {
        console.error('Failed to load attendance:', error);
        // Return empty array - component will load students if empty
        return of([]);
      })
    );
  }

  getAttendanceSummary(classId: number, month?: string): Observable<AttendanceSummary[]> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get<any>(`${this.baseUrl}/classes/${classId}/attendance/summary`, { params }).pipe(
      map(response => {
        const summaries = Array.isArray(response) ? response : (response.content || []);
        return summaries.map((s: any) => this.transformAttendanceSummary(s));
      }),
      catchError(error => {
        console.error('Failed to load attendance summary:', error);
        return of([]);
      })
    );
  }

  /**
   * Get attendance history for a class within a date range
   */
  getAttendanceHistory(classId: number, startDate: string, endDate: string): Observable<AttendanceHistoryResponse> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.baseUrl}/classes/${classId}/attendance/range`, { params }).pipe(
      map(response => {
        console.log('Attendance history response:', response);
        const records = (response.records || []).map((r: any) => this.transformAttendanceRecord(r));
        return {
          classId: response.classId || response.class_id || classId,
          className: response.className || response.class_name || '',
          startDate: response.startDate || response.start_date || startDate,
          endDate: response.endDate || response.end_date || endDate,
          totalRecords: response.totalRecords || response.total_records || records.length,
          records
        };
      }),
      catchError(error => {
        console.error('Failed to load attendance history:', error);
        return of({
          classId,
          className: '',
          startDate,
          endDate,
          totalRecords: 0,
          records: []
        });
      })
    );
  }

  markAttendance(data: MarkAttendanceRequest): Observable<AttendanceSummary> {
    const params = new HttpParams().set('date', data.date);
    // Send just the records array as the body
    const body = data.records.map(r => ({
      studentId: r.studentId,
      status: r.status,
      remarks: r.remarks || null
    }));

    return this.http.post<any>(`${this.baseUrl}/classes/${data.classId}/attendance`, body, { params }).pipe(
      map(response => {
        console.log('Mark attendance response:', response);
        // If response is the saved records, calculate summary
        if (Array.isArray(response)) {
          return {
            classId: data.classId,
            className: '',
            date: data.date,
            totalStudents: response.length,
            present: response.filter((r: any) => r.status === 'PRESENT').length,
            absent: response.filter((r: any) => r.status === 'ABSENT').length,
            late: response.filter((r: any) => r.status === 'LATE').length,
            excused: response.filter((r: any) => r.status === 'EXCUSED').length
          };
        }
        return this.transformAttendanceSummary(response);
      }),
      catchError(error => {
        console.error('Failed to mark attendance:', error);
        return throwError(() => new Error('Failed to mark attendance'));
      })
    );
  }

  getStudentFeeStatus(studentId: number): Observable<{
    studentId: number;
    totalFees: number;
    totalPaid: number;
    balance: number;
    status: string;
  }> {
    return this.http.get<any>(`${this.baseUrl}/students/${studentId}/fee-status`).pipe(
      map(response => ({
        studentId: response.studentId || response.student_id || studentId,
        totalFees: response.totalFees || response.total_fees || 0,
        totalPaid: response.totalPaid || response.total_paid || 0,
        balance: response.balance || 0,
        status: response.status || 'UNKNOWN'
      })),
      catchError(error => {
        console.error('Failed to load student fee status:', error);
        return of({
          studentId,
          totalFees: 0,
          totalPaid: 0,
          balance: 0,
          status: 'UNKNOWN'
        });
      })
    );
  }

  private transformDashboardStats(data: any): TeacherDashboardStats {
    console.log('Raw dashboard data:', JSON.stringify(data));

    // Handle various field names for attendance marked today
    const todayAttendance = data.todayAttendance ?? data.today_attendance ??
                           data.markedAttendance ?? data.marked_attendance ??
                           data.attendanceMarked ?? data.attendance_marked ??
                           data.classesWithAttendance ?? data.classes_with_attendance ??
                           data.attendanceCount ?? data.attendance_count ?? 0;

    // Handle various field names for pending attendance
    const totalClasses = data.totalClasses ?? data.total_classes ?? data.classCount ?? data.class_count ?? 0;
    const pendingAttendance = data.pendingAttendance ?? data.pending_attendance ??
                              data.pendingCount ?? data.pending_count ??
                              data.classesWithoutAttendance ?? data.classes_without_attendance ??
                              (totalClasses - todayAttendance);

    return {
      totalClasses,
      totalStudents: data.totalStudents ?? data.total_students ?? data.studentCount ?? data.student_count ?? 0,
      todayAttendance,
      pendingAttendance: pendingAttendance >= 0 ? pendingAttendance : 0
    };
  }

  private transformClass(data: any): TeacherClass {
    // Get subjects as comma-separated string
    const subjects = data.subjects?.map((s: any) => s.name).join(', ') || data.subject || '';

    return {
      id: data.id,
      name: data.name,
      grade: data.grade,
      section: data.section,
      academicYear: data.academicYear || data.academic_year || '',
      studentCount: data.currentEnrollment || data.current_enrollment || data.studentCount || data.student_count || 0,
      subject: subjects,
      schedule: data.schedule
    };
  }

  private transformStudent(data: any): Student {
    return {
      id: data.id,
      studentId: data.studentId || data.student_id || data.studentCode || data.student_code || '',
      firstName: data.firstName || data.first_name || '',
      lastName: data.lastName || data.last_name || '',
      fullName: data.fullName || data.full_name || `${data.firstName || data.first_name || ''} ${data.lastName || data.last_name || ''}`.trim(),
      email: data.email || '',
      gender: data.gender || 'MALE',
      status: data.status || 'ACTIVE'
    };
  }

  private transformAttendanceRecord(data: any): AttendanceRecord {
    return {
      id: data.id,
      studentId: data.studentId || data.student_id,
      studentName: data.studentName || data.student_name || '',
      studentNumber: data.studentNumber || data.student_number || data.studentCode || data.student_code || '',
      date: data.date,
      status: (data.status || 'PRESENT').toUpperCase() as any,
      remarks: data.remarks
    };
  }

  private transformAttendanceSummary(data: any): AttendanceSummary {
    return {
      classId: data.classId || data.class_id,
      className: data.className || data.class_name || '',
      date: data.date,
      totalStudents: data.totalStudents || data.total_students || 0,
      present: data.present || 0,
      absent: data.absent || 0,
      late: data.late || 0,
      excused: data.excused || 0
    };
  }
}