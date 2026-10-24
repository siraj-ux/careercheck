import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().default('./data/careerchecks.sqlite'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters long').default('careerchecks_dev_secret_key_32_characters_minimum'),
  OTP_MOCK_ENABLED: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  APP_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
