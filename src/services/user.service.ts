import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = new User();
    user.email = userData.email;
    user.passwordHash = await bcrypt.hash(userData.password, 10);
    user.name = userData.name;

    return this.userRepository.save(user);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<User> {
    const user = await this.getUserById(id);

    if (userData.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email, id: { $ne: id } }
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
      user.email = userData.email;
    }

    if (userData.name) {
      user.name = userData.name;
    }

    if (userData.password) {
      user.passwordHash = await bcrypt.hash(userData.password, 10);
    }

    return this.userRepository.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.getUserById(id);
    await this.userRepository.remove(user);
  }
}