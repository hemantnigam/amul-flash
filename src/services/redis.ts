import { Redis } from '@upstash/redis';

const redisUrl = process.env.EXPO_PUBLIC_UPSTASH_REDIS_REST_URL || '';
const redisToken = process.env.EXPO_PUBLIC_UPSTASH_REDIS_REST_TOKEN || '';

export const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;
