import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/types/authenticated-user';

const AUTH_USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  isActive: true,
  facultyAreaId: true,
  facultyArea: { select: { id: true, slug: true, name: true } },
} as const;

const TOKEN_TTL_SECONDS = 28_800;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { ...AUTH_USER_SELECT, passwordHash: true },
    });

    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, facultyAreaId: user.facultyAreaId };
    const accessToken = await this.jwt.signAsync(payload);
    const { passwordHash: _omit, ...authUser } = user;

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: TOKEN_TTL_SECONDS,
      user: this.toProfile(authUser),
    };
  }

  async validateActiveUser(userId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: AUTH_USER_SELECT,
    });
    if (!user || !user.isActive) return null;
    return user;
  }

  toProfile(user: AuthUser) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      facultyArea: user.facultyArea ?? null,
    };
  }
}
