export interface SchoolClass {
  id: number;
  name: string;
  grade: number;
  section?: string;
  academicYear: string;
  capacity?: number;
  studentCount?: number;
  classTeacher?: {
    id: number;
    name: string;
    email?: string;
  };
  subjects?: string[];
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassRequest {
  name: string;
  grade: number;
  section?: string;
  academicYear: string;
  maxCapacity?: number;
  classTeacherId?: number;
  subjectIds?: number[];
  description?: string;
}

export interface UpdateClassRequest extends CreateClassRequest {
  active?: boolean;
}