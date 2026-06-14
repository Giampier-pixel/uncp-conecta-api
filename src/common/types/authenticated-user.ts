import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  facultyAreaId: string | null;
}

export interface AuthFacultyArea {
  id: string;
  slug: string;
  name: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  facultyAreaId: string | null;
  facultyArea: AuthFacultyArea | null;
}
