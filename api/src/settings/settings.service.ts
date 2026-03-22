import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './setting.entity';

const DEFAULT_SETTINGS = [
  { key: 'session_topic', value: 'Truth and Postmodernism', label: 'Current Session Topic' },
  { key: 'session_time', value: '7:00 PM EAT', label: 'Session Time' },
  { key: 'session_venue', value: 'Online & In-Person (Nairobi)', label: 'Session Venue' },
  { key: 'session_description', value: 'Is there such a thing as objective truth? How does postmodernism challenge the gospel\'s claim that Jesus is "the way, the truth, and the life"?', label: 'Topic Description' },
  { key: 'session_poster', value: '/Posters/poster.png', label: 'Session Poster URL' },
];

@Injectable()
export class SettingsService implements OnApplicationBootstrap {
  constructor(@InjectRepository(Setting) private repo: Repository<Setting>) {}

  async onApplicationBootstrap() {
    for (const d of DEFAULT_SETTINGS) {
      const existing = await this.repo.findOne({ where: { key: d.key } });
      if (!existing) {
        await this.repo.save(d);
      }
    }
  }

  async getAll(): Promise<Record<string, string>> {
    const all = await this.repo.find();
    return Object.fromEntries(all.map((s) => [s.key, s.value]));
  }

  async get(key: string): Promise<string | null> {
    const s = await this.repo.findOne({ where: { key } });
    return s?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.repo.save({ key, value });
  }

  async setMany(updates: Record<string, string>): Promise<Record<string, string>> {
    const entries = Object.entries(updates).map(([key, value]) => ({ key, value }));
    await this.repo.save(entries);
    return this.getAll();
  }

  async seed(defaults: { key: string; value: string; label: string }[]): Promise<void> {
    for (const d of defaults) {
      const existing = await this.repo.findOne({ where: { key: d.key } });
      if (!existing) {
        await this.repo.save(d);
      }
    }
  }
}
