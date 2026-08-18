import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // 1. Create a native PostgreSQL connection pool
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // 2. Instantiate the Prisma PostgreSQL driver adapter
    const adapter = new PrismaPg(pool);

    // 3. Pass the adapter to the PrismaClient configuration
    super({ adapter });
  }

  async onModuleInit() {
    // Establish connection when module initializes
    await this.$connect();
  }

  async onModuleDestroy() {
    // Disconnect cleanly when module destroys
    await this.$disconnect();
  }
}
