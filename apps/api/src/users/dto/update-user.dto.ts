import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/** Every field is optional; a password is only changed when it is provided. */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
