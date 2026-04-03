import { UsersRepository } from "./users.repository";
import { AppError } from "../../utils/AppError";
import {
  getPaginationParams,
  buildPaginationMeta,
} from "../../utils/pagination";
import type { ListUsersQuery } from "./users.schemas";
import type { Role } from "../../generated/prisma/enums";

const usersRepository = new UsersRepository();

export class UsersService {
  async listUsers(query: ListUsersQuery) {
    const { page, limit } = getPaginationParams(query.page, query.limit);

    const { users, total } = await usersRepository.findAll({
      page,
      limit,
      role: query.role,
      isActive: query.isActive,
      search: query.search,
    });

    const meta = buildPaginationMeta(total, page, limit);
    return { users, meta };
  }

  async getUserById(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw AppError.notFound(`User with id '${id}' not found`);
    }
    return user;
  }

  async assignRole(id: string, role: Role, requestingUserId: string) {
    // Prevent admin from removing their own admin role (safety guard)
    if (id === requestingUserId && role !== "ADMIN") {
      throw AppError.badRequest("Admins cannot downgrade their own role");
    }

    const exists = await usersRepository.existsById(id);
    if (!exists) {
      throw AppError.notFound(`User with id '${id}' not found`);
    }

    return usersRepository.updateRole(id, role);
  }

  async updateStatus(id: string, isActive: boolean, requestingUserId: string) {
    // Prevent admin from deactivating themselves
    if (id === requestingUserId && !isActive) {
      throw AppError.badRequest("You cannot deactivate your own account");
    }

    const exists = await usersRepository.existsById(id);
    if (!exists) {
      throw AppError.notFound(`User with id '${id}' not found`);
    }

    return usersRepository.updateStatus(id, isActive);
  }
}
