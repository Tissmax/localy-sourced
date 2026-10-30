import { Catch } from "@nestjs/common/decorators/core/index.js";
import { HttpException } from "@nestjs/common/exceptions/index.js";
import { ArgumentsHost } from "@nestjs/common/interfaces/features/arguments-host.interface.js";
import { Logger } from "@nestjs/common/services/index.js";
import { BaseExceptionFilter } from "@nestjs/core/exceptions/index.js";
import { ZodSerializationException } from "nestjs-zod";
import { ZodError } from "zod";

 @Catch(HttpException)
 export class HttpExceptionFilter extends BaseExceptionFilter {
     private readonly logger = new Logger(HttpExceptionFilter.name);
 
     catch(exception: HttpException, host: ArgumentsHost) {
         if (exception instanceof ZodSerializationException) {
             const zodError = exception.getZodError();
            if (zodError instanceof ZodError) {
                 this.logger.error(`ZodSerializationException: ${zodError.message}`);
             }
         }
 
         super.catch(exception, host);
     }
}