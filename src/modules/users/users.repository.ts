import { prisma } from "../../config/database";
import type { Prisma } from "../../generated/prisma/client";
import type { Role } from "../../generated/prisma/enums";

const USER_SAFE_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface FindUsersOptions {
  page: number;
  limit: number;
  role?: Role;
  isActive?: boolean;
  search?: string;
}

export class UsersRepository {
  async findAll(options: FindUsersOptions) {
    const { page, limit, role, isActive, search } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_SAFE_FIELDS,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: USER_SAFE_FIELDS,
    });
  }

  async updateRole(id: string, role: Role) {
    return prisma.user.update({
      where: { id },
      data: { role },
      select: USER_SAFE_FIELDS,
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
      select: USER_SAFE_FIELDS,
    });
  }

  async existsById(id: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    return user !== null;
  }
}
