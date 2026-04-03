import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";

async function bootstrap() {
  // Verify database connectivity before accepting traffic
  try {
    await prisma.$connect();
    console.log("✅ Database connected");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`📍 API base: http://localhost:${env.PORT}/api/v1`);
    console.log(`❤️  Health:   http://localhost:${env.PORT}/health`);
  });

  // ─── Graceful shutdown ─────────────────────────────────────────────────
  async function shutdown(signal: string) {
    console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      console.log("🔌 HTTP server closed");
      await prisma.$disconnect();
      console.log("🗄️  Database disconnected");
      process.exit(0);
    });

    // Force shutdown after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error("⛔ Forced shutdown after timeout");
      process.exit(1);
    }, 10_000);
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    console.error("🔥 Unhandled Promise Rejection:", reason);
    void shutdown("UNHANDLED_REJECTION");
  });
}

void bootstrap();
