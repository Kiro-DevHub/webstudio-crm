import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateDealDto } from './create-deal.dto';

/**
 * A deal never changes client (create a new deal instead), and `stage` moves only
 * through PATCH /deals/:id/stage so that every move is validated and logged.
 */
export class UpdateDealDto extends PartialType(OmitType(CreateDealDto, ['clientId'] as const)) {}
