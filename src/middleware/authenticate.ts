import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";
import { prisma } from "../config/database";
import type { Role } from "../generated/prisma/enums";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw AppError.unauthorized("No token provided");
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const decoded = verifyToken(token);

    // Verify user still exists and is active in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      throw AppError.unauthorized("User no longer exists");
    }

    if (!user.isActive) {
      throw AppError.unauthorized("Account is deactivated");
    }

    // `select` guarantees these fields — cast away `| undefined` from partial select return
    req.user = {
      userId: user.id as string,
      email: user.email as string,
      role: user.role as Role,
    };

    next();
  } catch (error) {
    next(error);
  }
}
