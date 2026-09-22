import { User } from '../../../generated/prisma/client';

export function toSafeUser(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safeUser } = user;
  return safeUser;
}
