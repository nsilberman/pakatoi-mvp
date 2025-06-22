import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../models/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let repository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    repository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await repository.clear();
  });

  it('/api/users (POST)', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    return request(app.getHttpServer())
      .post('/api/users')
      .send(createUserDto)
      .expect(201)
      .expect(res => {
        expect(res.body.success).toBeTruthy();
        expect(res.body.data.email).toBe(createUserDto.email);
        expect(res.body.data.name).toBe(createUserDto.name);
        expect(res.body.data.passwordHash).toBeUndefined();
      });
  });

  it('/api/users/:id (GET)', async () => {
    const user = new User();
    user.email = 'test@example.com';
    user.passwordHash = await bcrypt.hash('password123', 10);
    user.name = 'Test User';

    const savedUser = await repository.save(user);

    return request(app.getHttpServer())
      .get(`/api/users/${savedUser.id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.success).toBeTruthy();
        expect(res.body.data.email).toBe(savedUser.email);
        expect(res.body.data.name).toBe(savedUser.name);
        expect(res.body.data.passwordHash).toBeUndefined();
      });
  });

  it('/api/users/:id (PUT)', async () => {
    const user = new User();
    user.email = 'test@example.com';
    user.passwordHash = await bcrypt.hash('password123', 10);
    user.name = 'Test User';

    const savedUser = await repository.save(user);

    const updateUserDto = {
      name: 'Updated Name',
    };

    return request(app.getHttpServer())
      .put(`/api/users/${savedUser.id}`)
      .send(updateUserDto)
      .expect(200)
      .expect(res => {
        expect(res.body.success).toBeTruthy();
        expect(res.body.data.name).toBe(updateUserDto.name);
      });
  });

  it('/api/users/:id (DELETE)', async () => {
    const user = new User();
    user.email = 'test@example.com';
    user.passwordHash = await bcrypt.hash('password123', 10);
    user.name = 'Test User';

    const savedUser = await repository.save(user);

    return request(app.getHttpServer())
      .delete(`/api/users/${savedUser.id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.success).toBeTruthy();
        expect(res.body.message).toBe('User deleted successfully');
      });
  });
});