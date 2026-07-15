import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Task } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Paginated } from '../../common/dto/paginated';
import type { SafeUser } from '../../common/types/user.types';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks with pagination and filters (incl. overdue)' })
  list(@Query() query: ListTasksQueryDto): Promise<Paginated<Task>> {
    return this.tasksService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task' })
  findOne(@Param('id') id: string): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a task (writes a TASK_CREATED activity)' })
  create(@Body() dto: CreateTaskDto, @CurrentUser() actor: SafeUser): Promise<Task> {
    return this.tasksService.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a task (assignee or ADMIN); moving status to DONE logs TASK_COMPLETED',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() actor: SafeUser,
  ): Promise<Task> {
    return this.tasksService.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task (assignee or ADMIN)' })
  remove(@Param('id') id: string, @CurrentUser() actor: SafeUser): Promise<void> {
    return this.tasksService.remove(id, actor);
  }
}
