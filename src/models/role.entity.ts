import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('roles')
export class Role {
  @ApiProperty({ description: 'Role unique identifier', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Role name', example: 'ADMIN' })
  @Column({ unique: true, length: 50 })
  name: string;

  @ApiProperty({ description: 'Role description', example: 'Administrator with full system access' })
  @Column({ length: 255, nullable: true })
  description?: string;

  @ApiProperty({ description: 'Role active status', example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Role priority level', example: 1 })
  @Column({ default: 0 })
  priority: number;

  @ApiProperty({ description: 'Users with this role', type: () => [User] })
  @ManyToMany(() => User, user => user.roles)
  users: User[];

  @ApiProperty({ description: 'Permissions granted by this role', type: () => [Permission] })
  @ManyToMany(() => Permission, permission => permission.roles, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' }
  })
  permissions: Permission[];

  @ApiProperty({ description: 'Role creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  hasPermission(permissionName: string): boolean {
    return this.permissions.some(permission => permission.name === permissionName);
  }

  addPermission(permission: Permission): void {
    if (!this.permissions) {
      this.permissions = [];
    }
    if (!this.permissions.find(p => p.id === permission.id)) {
      this.permissions.push(permission);
    }
  }

  removePermission(permissionId: string): void {
    if (this.permissions) {
      this.permissions = this.permissions.filter(p => p.id !== permissionId);
    }
  }
}