import { Injectable } from '@nestjs/common';
import { User } from '../models';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findOne(name: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { name } });
  }

  async createOne({ name, password }: User): Promise<User> {
    const newUser = this.userRepository.create({ name, password });
    return this.userRepository.save(newUser);
  }
}
