import { Controller, Post, Get, Put, Delete, Body, Param, Res, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@Controller('/api/users')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @Post('/')
  async createUser(@Body() userData: CreateUserDto, @Res() response: Response): Promise<Response> {
    try {
      const user = await this.userService.createUser(userData);
      return response.status(201).json({ success: true, data: this.sanitizeUser(user) });
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  @ApiOperation({ summary: 'Get user details' })
  @ApiResponse({ status: 200, description: 'User details retrieved.' })
  @Get('/:id')
  async getUser(@Param('id') id: string, @Res() response: Response): Promise<Response> {
    try {
      const user = await this.userService.getUserById(id);
      return response.status(200).json({ success: true, data: this.sanitizeUser(user) });
    } catch (error) {
      throw new HttpException(error.message, 404);
    }
  }

  @ApiOperation({ summary: 'Update user details' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @Put('/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() userData: UpdateUserDto,
    @Res() response: Response
  ): Promise<Response> {
    try {
      const user = await this.userService.updateUser(id, userData);
      return response.status(200).json({ success: true, data: this.sanitizeUser(user) });
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @Delete('/:id')
  async deleteUser(@Param('id') id: string, @Res() response: Response): Promise<Response> {
    try {
      await this.userService.deleteUser(id);
      return response.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  private sanitizeUser(user: any): any {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}