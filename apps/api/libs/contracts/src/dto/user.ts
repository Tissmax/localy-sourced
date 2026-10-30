import { UserAccountCreationSchema, UserAccountUpdatePasswordSchema, UserAccountUpdateSchema, UserConnectionSchema, UserResponseSchema } from '@repo/schema';
import { createZodDto } from 'nestjs-zod';

class UserConnectionDto extends createZodDto(UserConnectionSchema) {}
class UserAccountCreationDto extends createZodDto(UserAccountCreationSchema) {}
class UserResponseDto extends createZodDto(UserResponseSchema) {}
class UserAccountUpdateDto extends createZodDto(UserAccountUpdateSchema) {}
class UserAccountUpdatePasswordDto extends createZodDto(UserAccountUpdatePasswordSchema) {}

export {
    UserAccountCreationDto, UserAccountUpdateDto,
    UserAccountUpdatePasswordDto, UserConnectionDto, UserResponseDto
};
