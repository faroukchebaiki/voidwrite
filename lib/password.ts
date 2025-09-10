export async function hashPassword(password: string): Promise<string> {
  try {
    const a = await import('argon2');
    return await a.hash(password);
  } catch {
    const { hash } = await import('@node-rs/argon2');
    return await hash(password);
  }
}

export async function verifyPassword(hashStr: string, password: string): Promise<boolean> {
  try {
    const a = await import('argon2');
    return await a.verify(hashStr, password);
  } catch {
    const { verify } = await import('@node-rs/argon2');
    return await verify(hashStr, password);
  }
}

