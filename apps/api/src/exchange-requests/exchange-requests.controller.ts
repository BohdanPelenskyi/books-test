import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ExchangeRequestResponseDto } from './dto/exchange-request-response.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PublicUser } from '../users/user.select';
import { CreateExchangeRequestDto } from './dto/create-exchange-request.dto';
import { UpdateExchangeRequestDto } from './dto/update-exchange-request.dto';
import { ExchangeRequestsService, ExchangeRequestView } from './exchange-requests.service';

const CREATE_THROTTLE = { limit: 10, ttl: 60_000 };

@ApiTags('exchange requests')
@ApiBearerAuth()
@Controller('exchange-requests')
export class ExchangeRequestsController {
  constructor(private readonly exchangeRequestsService: ExchangeRequestsService) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: CREATE_THROTTLE })
  @ApiOperation({ summary: 'Request an exchange for a book; emails its owner' })
  @ApiCreatedResponse({ type: ExchangeRequestResponseDto })
  create(
    @CurrentUser() user: PublicUser,
    @Body() dto: CreateExchangeRequestDto,
  ): Promise<ExchangeRequestView> {
    return this.exchangeRequestsService.create(user, dto);
  }

  @Get('incoming')
  @ApiOperation({ summary: 'Requests for my books' })
  @ApiOkResponse({ type: [ExchangeRequestResponseDto] })
  findIncoming(@CurrentUser() user: PublicUser): Promise<ExchangeRequestView[]> {
    return this.exchangeRequestsService.findIncoming(user.id);
  }

  @Get('outgoing')
  @ApiOperation({ summary: 'Requests I have sent' })
  @ApiOkResponse({ type: [ExchangeRequestResponseDto] })
  findOutgoing(@CurrentUser() user: PublicUser): Promise<ExchangeRequestView[]> {
    return this.exchangeRequestsService.findOutgoing(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Accept, decline (owner) or cancel (requester) a pending request' })
  @ApiOkResponse({ type: ExchangeRequestResponseDto })
  respond(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { action }: UpdateExchangeRequestDto,
  ): Promise<ExchangeRequestView> {
    return this.exchangeRequestsService.respond(user.id, id, action);
  }
}
