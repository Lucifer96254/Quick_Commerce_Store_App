import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async check() {
    const [dbHealth, redisHealth] = await Promise.all([
      this.db.healthCheck(),
      this.redis.healthCheck(),
    ]);

    const isHealthy = dbHealth && redisHealth;

    return {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbHealth ? 'connected' : 'disconnected',
        redis: redisHealth ? 'connected' : 'disconnected',
        storage: 'connected', // Cloudinary check could be added
      },
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  async live() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async ready() {
    const [dbHealth, redisHealth] = await Promise.all([
      this.db.healthCheck(),
      this.redis.healthCheck(),
    ]);

    if (!dbHealth || !redisHealth) {
      return { status: 'not ready', timestamp: new Date().toISOString() };
    }

    return { status: 'ready', timestamp: new Date().toISOString() };
  }
}
