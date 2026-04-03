import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import type { Role } from "../generated/prisma/enums";

/**
 * Authorize middleware factory.
 * Usage: authorize('ADMIN') or authorize('ANALYST', 'ADMIN')
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        ),
      );
    }

    next();
  };
}
