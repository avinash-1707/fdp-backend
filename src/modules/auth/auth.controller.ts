import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { successResponse } from "../../utils/apiResponse";
import type { RegisterInput, LoginInput } from "./auth.schemas";

const authService = new AuthService();

export class AuthController {
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.register(req.body as RegisterInput);
      res
        .status(201)
        .json(successResponse("Account created successfully", result));
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body as LoginInput);
      res.status(200).json(successResponse("Login successful", result));
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.status(200).json(successResponse("User profile retrieved", user));
    } catch (error) {
      next(error);
    }
  }
}
