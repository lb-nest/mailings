import {
  ArgumentsHost,
  Catch,
  HttpException,
  RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { Observable, throwError } from 'rxjs';

@Catch()
export class GlobalExceptionFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    if (exception instanceof PrismaClientKnownRequestError) {
      return throwError(() => new RpcException(exception.code));
    }

    if (exception instanceof HttpException) {
      return throwError(() => new RpcException(exception.getResponse()));
    }

    return throwError(() => new RpcException(exception));
  }
}
