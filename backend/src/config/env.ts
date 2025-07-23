import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('5001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  OBIEX_API_KEY: z.string(),
  OBIEX_API_SECRET: z.string(),
  OBIEX_SANDBOX_MODE: z.string().default('false'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .filter((e: z.ZodIssue) => e.code === 'invalid_type')
        .map((e: z.ZodIssue) => e.path.join('.'))
        .join(', ');
      
      throw new Error(`Missing required environment variables: ${missingVars}`);
    }
    throw error;
  }
}

export const config = validateEnv(); 