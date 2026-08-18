import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  findById(id: number) {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  create(user: Partial<User>) {
    return this.userRepository.save(user);
  }

  async save(user: User) {
    return this.userRepository.save(user);
  }
}