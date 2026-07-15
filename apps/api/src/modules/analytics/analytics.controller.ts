import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { SafeUser } from '../../common/types/user.types';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsSummary,
  FunnelStage,
  LostReason,
  RecentActivityEntry,
  RevenueByMonthPoint,
  TopManager,
} from './analytics.types';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

/**
 * Dashboard read models. Every endpoint accepts `from` / `to` (ISO dates,
 * half-open `[from, to)`, default: last 6 months) and, for ADMIN, `ownerId`.
 */
@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'KPI summary with deltas vs the previous period',
    description:
      'Revenue (sum of WON, kopecks), new deals, WON conversion of closed deals (%), ' +
      'average WON amount, deals still open at period end, and tasks that became overdue ' +
      'in the period. Each metric carries deltaPct vs the preceding period of equal length.',
  })
  summary(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() actor: SafeUser,
  ): Promise<AnalyticsSummary> {
    return this.analyticsService.summary(query, actor);
  }

  @Get('revenue-by-month')
  @ApiOperation({
    summary: 'WON revenue and deal count per calendar month, zero months included',
  })
  revenueByMonth(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() actor: SafeUser,
  ): Promise<RevenueByMonthPoint[]> {
    return this.analyticsService.revenueByMonth(query, actor);
  }

  @Get('funnel')
  @ApiOperation({
    summary: 'Count and amount of deals currently sitting on each pipeline stage',
  })
  funnel(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() actor: SafeUser,
  ): Promise<FunnelStage[]> {
    return this.analyticsService.funnel(query, actor);
  }

  @Get('top-managers')
  @ApiOperation({
    summary: 'Managers ranked by WON revenue, with deal counts and conversion',
  })
  topManagers(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() actor: SafeUser,
  ): Promise<TopManager[]> {
    return this.analyticsService.topManagers(query, actor);
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Last 20 activity records with user, deal and client' })
  recentActivity(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() actor: SafeUser,
  ): Promise<RecentActivityEntry[]> {
    return this.analyticsService.recentActivity(query, actor);
  }

  @Get('lost-reasons')
  @ApiOperation({ summary: 'Top reasons deals were lost in the period, by count' })
  lostReasons(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() actor: SafeUser,
  ): Promise<LostReason[]> {
    return this.analyticsService.lostReasons(query, actor);
  }
}
