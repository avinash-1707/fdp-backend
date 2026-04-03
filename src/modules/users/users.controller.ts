import type { Request, Response, NextFunction } from "express";
import { UsersService } from "./users.service";
import { successResponse } from "../../utils/apiResponse";
import type {
  AssignRoleInput,
  ListUsersQuery,
  UpdateStatusInput,
} from "./users.schemas";

const usersService = new UsersService();

export class UsersController {
  async listUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { users, meta } = await usersService.listUsers(
        req.query as ListUsersQuery,
      );
      res
        .status(200)
        .json(successResponse("Users retrieved successfully", users, meta));
    } catch (error) {
      next(error);
    }
  }

  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const user = await usersService.getUserById(id);
      res
        .status(200)
        .json(successResponse("User retrieved successfully", user));
    } catch (error) {
      next(error);
    }
  }

  async assignRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const { role } = req.body as AssignRoleInput;
      const user = await usersService.assignRole(id, role, req.user!.userId);
      res.status(200).json(successResponse("Role assigned successfully", user));
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const { isActive } = req.body as UpdateStatusInput;
      const user = await usersService.updateStatus(
        id,
        isActive,
        req.user!.userId,
      );
      res
        .status(200)
        .json(successResponse("User status updated successfully", user));
    } catch (error) {
      next(error);
    }
  }
}
