import { PoolMember } from './PoolMember';

export interface Pool {
  id?: number;
  year: number;
  createdAt?: Date;
  members: PoolMember[];
}
