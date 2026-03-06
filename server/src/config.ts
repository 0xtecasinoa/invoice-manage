export const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL || "postgresql://localhost:5432/invoice_system",
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production-use-long-random-string",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptRounds: 12,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:8080",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:8080",
};
