import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { SafeUser } from '../../common/types/user.types';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UsersService } from './users.service';
import type { PaginatedUsers } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (ADMIN only)' })
  list(@Query() query: ListUsersQueryDto): Promise<PaginatedUsers> {
    return this.usersService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a manager (ADMIN only)' })
  create(@Body() dto: CreateUserDto): Promise<SafeUser> {
    return this.usersService.createManager(dto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user (ADMIN only)' })
  deactivate(@Param('id') id: string, @CurrentUser() currentUser: SafeUser): Promise<SafeUser> {
    return this.usersService.deactivate(id, currentUser.id);
  }
}
