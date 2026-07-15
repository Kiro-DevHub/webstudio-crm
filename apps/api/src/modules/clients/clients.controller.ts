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
import { Client } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Paginated } from '../../common/dto/paginated';
import type { SafeUser } from '../../common/types/user.types';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List clients with pagination, search and filters' })
  list(@Query() query: ListClientsQueryDto): Promise<Paginated<Client>> {
    return this.clientsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client with its owner and deals' })
  findOne(@Param('id') id: string): Promise<Client> {
    return this.clientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a client (writes a CLIENT_CREATED activity)' })
  create(@Body() dto: CreateClientDto, @CurrentUser() actor: SafeUser): Promise<Client> {
    return this.clientsService.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client (owner or ADMIN)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() actor: SafeUser,
  ): Promise<Client> {
    return this.clientsService.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a client with its deals (owner or ADMIN)' })
  remove(@Param('id') id: string, @CurrentUser() actor: SafeUser): Promise<void> {
    return this.clientsService.remove(id, actor);
  }
}
