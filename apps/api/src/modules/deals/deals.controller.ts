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
import { Deal } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Paginated } from '../../common/dto/paginated';
import type { SafeUser } from '../../common/types/user.types';
import { DealsBoard, DealsService } from './deals.service';
import { BoardQueryDto } from './dto/board-query.dto';
import { ChangeDealStageDto } from './dto/change-deal-stage.dto';
import { CreateDealDto } from './dto/create-deal.dto';
import { ListDealsQueryDto } from './dto/list-deals-query.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

@ApiTags('deals')
@ApiBearerAuth()
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @ApiOperation({ summary: 'List deals with pagination and filters' })
  list(@Query() query: ListDealsQueryDto): Promise<Paginated<Deal>> {
    return this.dealsService.list(query);
  }

  @Get('board')
  @ApiOperation({
    summary: 'Kanban board: all open deals with overdue-task counts, plus WON/LOST totals',
  })
  board(@Query() query: BoardQueryDto): Promise<DealsBoard> {
    return this.dealsService.board(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a deal with client, owner, tasks, notes and activity feed' })
  findOne(@Param('id') id: string): Promise<Deal> {
    return this.dealsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a deal at stage LEAD (writes a DEAL_CREATED activity)' })
  create(@Body() dto: CreateDealDto, @CurrentUser() actor: SafeUser): Promise<Deal> {
    return this.dealsService.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a deal, except its stage and client (owner or ADMIN)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
    @CurrentUser() actor: SafeUser,
  ): Promise<Deal> {
    return this.dealsService.update(id, dto, actor);
  }

  @Patch(':id/stage')
  @ApiOperation({
    summary: 'Move a deal through the pipeline (owner or ADMIN)',
    description:
      'Open stages move freely; WON/LOST are reachable from any open stage and are final. ' +
      'LOST requires lostReason. Stamps closedAt and writes a STAGE_CHANGED activity.',
  })
  changeStage(
    @Param('id') id: string,
    @Body() dto: ChangeDealStageDto,
    @CurrentUser() actor: SafeUser,
  ): Promise<Deal> {
    return this.dealsService.changeStage(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a deal (owner or ADMIN)' })
  remove(@Param('id') id: string, @CurrentUser() actor: SafeUser): Promise<void> {
    return this.dealsService.remove(id, actor);
  }
}
