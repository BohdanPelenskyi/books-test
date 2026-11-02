Object.assign(process.env, {
  DATABASE_URL: process.env.E2E_DATABASE_URL ?? 'postgresql://unused',
  JWT_SECRET: 'e2e-secret-with-enough-length',
  JWT_EXPIRES_IN: '1h',
  WEB_URL: 'http://localhost:3000',
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  MAIL_FROM: 'test@example.com',
});
