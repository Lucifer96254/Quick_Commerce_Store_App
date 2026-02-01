import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@quickmart/db';
import { LoggerService } from '../common/services/logger.service';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly logger: LoggerService) {
    super({
      log: process.env.NODE_ENV === 'development' 
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully', 'DatabaseService');

    if (process.env.NODE_ENV === 'development') {
      // @ts-expect-error - Prisma event types
      this.$on('query', (e: { query: string; duration: number }) => {
        this.logger.debug(`Query: ${e.query} (${e.duration}ms)`, 'DatabaseService');
      });
    }

    // @ts-expect-error - Prisma event types
    this.$on('error', (e: { message: string }) => {
      this.logger.error(e.message, undefined, 'DatabaseService');
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected', 'DatabaseService');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  // Transaction helper
  async executeTransaction<T>(
    fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(fn, {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: 'Serializable',
    });
  }
}
