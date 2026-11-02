import { PartialType, PickType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/** Name and email are optional; the avatar travels as a multipart file named `avatar`. */
export class UpdateProfileDto extends PartialType(PickType(CreateUserDto, ['name', 'email'])) {}
