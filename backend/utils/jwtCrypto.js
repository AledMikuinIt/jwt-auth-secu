import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');


export const encryptPayload = (payload, key) => {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
  throw new Error('Clé invalide : doit être un Buffer de 32 octets');
}
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

export const decryptPayload = (encrypted, key) => {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
  throw new Error('Clé invalide : doit être un Buffer de 32 octets');
}
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};
