import { db } from './db/index';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { users, sessions, accounts, verificationTokens, authenticators } from './db/auth-schema';
import { randomUUID } from 'node:crypto';

const adapter = DrizzleAdapter(db as any, { usersTable: users as any, accountsTable: accounts as any, sessionsTable: sessions as any, verificationTokensTable: verificationTokens as any, authenticatorsTable: authenticators as any });

(async () => {
  try {
    const session = await adapter.createSession({ sessionToken: randomUUID(), userId: 'no-user', expires: new Date(Date.now()+ 60*60*1000) });
    console.log('created session', session);
  } catch (e) {
    console.error('adapter error', e);
  }
})();
