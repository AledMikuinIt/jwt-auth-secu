import argon2 from 'argon2';
import dotenv from 'dotenv';
dotenv.config();

import jwtKeys from '../config/jwtKeys.js';

export async function deriveKey(secret) {
  if (!secret) throw new Error("Secret required for key derivation");

  const saltHex = process.env.JWT_SALT;
  if (!saltHex || saltHex.length < 16) throw new Error("JWT_SALT missing or too short");

  const salt = Buffer.from(saltHex, 'hex');
  if (salt.length < 8) throw new Error("JWT_SALT must be at least 8 bytes");

  const key = await argon2.hash(secret, {
    type: argon2.argon2id,
    salt,
    hashLength: 32,
    raw: true,
  });

  return key;
}

export async function initDerivedKeys() {
  jwtKeys.derivedAccess = await deriveKey(jwtKeys.current);
  jwtKeys.derivedRefresh = await deriveKey(jwtKeys.refresh);
  console.log('✅ Keys derived and stored in jwtKeys');
}