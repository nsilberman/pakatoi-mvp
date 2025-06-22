import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Role } from './role.entity';
import * as bcrypt from 'bcrypt';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({ description: 'User unique identifier', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User email address', example: 'john.doe@example.com' })
  @Column({ unique: true, length: 255 })
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @Column({ length: 100 })
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 255 })
  password: string;

  @ApiProperty({ description: 'User phone number', example: '+33123456789', required: false })
  @Column({ nullable: true, length: 20 })
  phone?: string;

  @ApiProperty({ description: 'User avatar URL', required: false })
  @Column({ nullable: true })
  avatar?: string;

  @ApiProperty({ description: 'Account verification status', example: true })
  @Column({ default: false })
  isVerified: boolean;

  @ApiProperty({ description: 'Account active status', example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last login timestamp' })
  @Column({ nullable: true })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Email verification token', required: false })
  @Column({ nullable: true })
  verificationToken?: string;

  @ApiProperty({ description: 'Password reset token', required: false })
  @Column({ nullable: true })
  resetPasswordToken?: string;

  @ApiProperty({ description: 'Password reset token expiration', required: false })
  @Column({ nullable: true })
  resetPasswordExpires?: Date;

  @ApiProperty({ description: 'User roles', type: () => [Role] })
  @ManyToMany(() => Role, role => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' }
  })
  roles: Role[];

  @ApiProperty({ description: 'Account creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  hasRole(roleName: string): boolean {
    return this.roles.some(role => role.name === roleName);
  }

  hasPermission(permissionName: string): boolean {
    return this.roles.some(role => 
      role.permissions.some(permission => permission.name === permissionName)
    );
  }

  toJSON() {
    const { password, verificationToken, resetPasswordToken, ...result } = this;
    return result;
  }
}