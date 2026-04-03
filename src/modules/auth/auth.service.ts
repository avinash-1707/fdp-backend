import { prisma } from "../../config/database";
import { hashPassword, comparePassword } from "../../utils/password";
import { signToken } from "../../utils/jwt";
import { AppError } from "../../utils/AppError";
import type { RegisterInput, LoginInput } from "./auth.schemas";

// Fields we are safe to return in responses (never return password)
const USER_SAFE_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export class AuthService {
  async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw AppError.conflict("An account with this email already exists");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "VIEWER",
        isActive: true,
      },
      select: USER_SAFE_FIELDS,
    });

    // select guarantees these fields — cast partial select result
    const userId = user.id as string;
    const email = user.email as string;
    const role = (user.role as string) ?? "VIEWER";

    const token = signToken({ userId, email, role });
    return { user, token };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Same error for wrong email or wrong password — prevents email enumeration
      throw AppError.unauthorized("Invalid email or password");
    }

    if (!user.isActive) {
      throw AppError.unauthorized(
        "Account is deactivated. Contact an administrator.",
      );
    }

    const isPasswordValid = await comparePassword(
      data.password,
      user.password as string,
    );

    if (!isPasswordValid) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const token = signToken({
      userId: user.id as string,
      email: user.email as string,
      role: (user.role as string) ?? "VIEWER",
    });

    // Strip password before returning
    const { password: _password, ...safeUser } = user as typeof user & {
      password: string;
    };

    return { user: safeUser, token };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_SAFE_FIELDS,
    });

    if (!user) {
      throw AppError.notFound("User not found");
    }

    return user;
  }
}
