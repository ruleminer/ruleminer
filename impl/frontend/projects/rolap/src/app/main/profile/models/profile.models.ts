import { UserLimits } from '../../project/service/models/account.model';

export interface UserPlan {
  email: string;
  plan: string;
  current_limits: UserLimits;
}

export interface UserCurrentPlan {
  plan: string;
  currentLimits: UserLimits;
}
