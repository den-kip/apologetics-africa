import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

function computeName(firstName: string, middleName?: string, lastName?: string): string {
  return [firstName, middleName, lastName].filter(Boolean).join(' ');
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already in use');

    if (dto.username) {
      const taken = await this.repo.findOne({ where: { username: dto.username } });
      if (taken) throw new ConflictException('Username already taken');
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    const name = computeName(dto.firstName, dto.middleName, dto.lastName);
    const user = this.repo.create({ ...dto, password: hashed, name });
    return this.repo.save(user);
  }

  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.repo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 12);
    }
    // Recompute name if name parts change
    const firstName = dto.firstName ?? user.firstName;
    const middleName = dto.middleName !== undefined ? dto.middleName : user.middleName;
    const lastName = dto.lastName ?? user.lastName;
    if (dto.firstName || dto.lastName) {
      (dto as any).name = computeName(firstName, middleName, lastName);
    }
    Object.assign(user, dto);
    return this.repo.save(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.username && dto.username !== user.username) {
      const taken = await this.repo.findOne({ where: { username: dto.username } });
      if (taken) throw new ConflictException('Username already taken');
    }

    const firstName = dto.firstName ?? user.firstName;
    const middleName = dto.middleName !== undefined ? dto.middleName : user.middleName;
    const lastName = dto.lastName ?? user.lastName;

    Object.assign(user, dto);
    user.name = computeName(firstName, middleName, lastName);
    return this.repo.save(user);
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user.active) return;
    user.active = false;
    user.deactivatedAt = new Date();
    await this.repo.save(user);
  }

  async reactivate(id: string): Promise<void> {
    await this.repo.update(id, { active: true, deactivatedAt: null });
  }

  async purgeDeactivated(): Promise<number> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const expired = await this.repo.find({
      where: { active: false, deactivatedAt: LessThan(cutoff) },
    });
    if (expired.length === 0) return 0;
    await this.repo.remove(expired);
    return expired.length;
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    user.password = await bcrypt.hash(newPassword, 12);
    await this.repo.save(user);
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    const hashed = token ? await bcrypt.hash(token, 10) : null;
    await this.repo.update(id, { refreshToken: hashed });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.repo.remove(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async validateRefreshToken(id: string, token: string): Promise<boolean> {
    const user = await this.findOne(id);
    if (!user.refreshToken) return false;
    return bcrypt.compare(token, user.refreshToken);
  }

  async setRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    user.role = role;
    return this.repo.save(user);
  }

  async getStats(): Promise<{ total: number; active: number; inactive: number; admins: number; editors: number }> {
    const total = await this.repo.count();
    const active = await this.repo.count({ where: { active: true } });
    const admins = await this.repo.count({ where: { role: UserRole.ADMIN } });
    const editors = await this.repo.count({ where: { role: UserRole.EDITOR } });
    return { total, active, inactive: total - active, admins, editors };
  }
}
