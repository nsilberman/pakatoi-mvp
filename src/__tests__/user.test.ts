import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../services/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../models/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should create a user', async () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    jest.spyOn(repository, 'findOne').mockResolvedValue(null);
    jest.spyOn(repository, 'save').mockImplementation(user => Promise.resolve(user as User));

    const result = await service.createUser(createUserDto);

    expect(result).toBeDefined();
    expect(result.email).toBe(createUserDto.email);
    expect(result.name).toBe(createUserDto.name);
    expect(await bcrypt.compare(createUserDto.password, result.passwordHash)).toBeTruthy();
  });

  it('should throw an error if user already exists', async () => {
    const createUserDto: CreateUserDto = {
      email: 'existing@example.com',
      password: 'password123',
      name: 'Test User',
    };

    jest.spyOn(repository, 'findOne').mockResolvedValue(new User());

    await expect(service.createUser(createUserDto)).rejects.toThrow('User already exists');
  });

  it('should get user by id', async () => {
    const mockUser = new User();
    mockUser.id = '123';
    mockUser.email = 'test@example.com';
    mockUser.name = 'Test User';

    jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

    const result = await service.getUserById('123');

    expect(result).toBeDefined();
    expect(result.id).toBe('123');
    expect(result.email).toBe('test@example.com');
  });

  it('should throw error if user not found', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    await expect(service.getUserById('123')).rejects.toThrow('User not found');
  });
});