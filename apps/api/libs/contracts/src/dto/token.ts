import { LoginResponseSchema, RefreshResponseSchema, RefreshSchema } from "@repo/schema";
import { createZodDto } from "nestjs-zod";

export class RefreshResponseDto extends createZodDto(RefreshResponseSchema) {}
export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}  
export class RefreshDto extends createZodDto(RefreshSchema) {}