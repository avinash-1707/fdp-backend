import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import { registerSchema, loginSchema } from "./auth.schemas";

const router = Router();
const authController = new AuthController();

router.post("/register", validate(registerSchema), (req, res, next) =>
  authController.register(req, res, next),
);

router.post("/login", validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next),
);

router.get("/me", authenticate, (req, res, next) =>
  authController.me(req, res, next),
);

export default router;
