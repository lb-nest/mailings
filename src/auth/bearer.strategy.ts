import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { lastValueFrom } from 'rxjs';
import { AUTH_SERVICE } from '../shared/constants/broker';
import { TokenPayload } from './entities/token-payload.entity';

@Injectable()
export class BearerStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(AUTH_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  async validate(token: string): Promise<TokenPayload> {
    try {
      return await lastValueFrom(
        this.client.send<TokenPayload>('auth.validateToken', {
          headers: {
            authorization: `Bearer ${token}`,
          },
          payload: null,
        }),
      );
    } catch {
      throw new UnauthorizedException();
    }
  }
}
