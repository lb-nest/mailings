import { Billing } from './billing.entity';
import { Role } from './role.entity';

export class TokenPayload {
  id: number;
  project?: {
    id: number;
    billing: Billing;
    roles: Role[];
  };
}
