import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('API_KEY_ENCRYPTION_SECRET environment variable is not set');
  }
  // Derive a 32-byte key from the secret using SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptApiKey(plaintext: string): { encrypted: string; iv: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Append auth tag to the encrypted data
  const authTag = cipher.getAuthTag();
  encrypted += authTag.toString('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
  };
}

export function decryptApiKey(encrypted: string, iv: string): string {
  const key = getEncryptionKey();
  const ivBuffer = Buffer.from(iv, 'hex');

  // Split encrypted data and auth tag
  const authTagHex = encrypted.slice(-AUTH_TAG_LENGTH * 2);
  const encryptedData = encrypted.slice(0, -AUTH_TAG_LENGTH * 2);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '****';
  const prefix = key.slice(0, Math.min(key.indexOf('-') + 1 || 4, 7));
  const suffix = key.slice(-4);
  return `${prefix}...${suffix}`;
}
