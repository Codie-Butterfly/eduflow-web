export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';