import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { UsersService } from './users.service';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

@Injectable()
export class UsersCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UsersCleanupService.name);
  private intervalId: ReturnType<typeof setInterval>;

  constructor(private usersService: UsersService) {}

  async onModuleInit() {
    await this.purge();
    this.intervalId = setInterval(() => this.purge(), TWENTY_FOUR_HOURS);
  }

  onModuleDestroy() {
    clearInterval(this.intervalId);
  }

  private async purge() {
    try {
      const deleted = await this.usersService.purgeDeactivated();
      if (deleted > 0) {
        this.logger.log(`Purged ${deleted} account(s) deactivated more than 30 days ago`);
      }
    } catch (err) {
      this.logger.error('Failed to purge deactivated accounts', err);
    }
  }
}
