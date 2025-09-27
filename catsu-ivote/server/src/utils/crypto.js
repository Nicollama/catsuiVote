const crypto = require('crypto');

const MASTER_KEY = Buffer.from(process.env.MASTER_KEY_BASE64 || '', 'base64');
if (MASTER_KEY.length !== 32) {
  console.warn('MASTER_KEY not 32 bytes. For prototype generate a 32-byte base64 key.');
}

/**
 * AES-GCM encrypt plaintext with per-vote key
 * returns { ciphertext, iv, tag } all as base64 strings
 */
function aesGcmEncrypt(perKey, plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', perKey, iv);
  const ct = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ct.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

/**
 * aesGcmDecrypt
 * expects all inputs as base64 strings
 */
function aesGcmDecrypt(perKey, ivB64, cipherB64, tagB64) {
  try {
    const iv = Buffer.from(ivB64, 'base64');
    const ct = Buffer.from(cipherB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', perKey, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString('utf8');
  } catch (err) {
    console.error('❌ AES-GCM decrypt failed:', err.message);
    return null;
  }
}

/**
 * Wrap a per-vote key with master key
 * returns base64 string
 */
function wrapKey(perKey) {
  const cipher = crypto.createCipheriv('aes-256-ecb', MASTER_KEY, null);
  cipher.setAutoPadding(true);
  const wrapped = Buffer.concat([cipher.update(perKey), cipher.final()]);
  return wrapped.toString('base64');
}

/**
 * Unwrap
 * expects base64 string, returns Buffer
 */
function unwrapKey(wrappedB64) {
  const wrapped = Buffer.from(wrappedB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-ecb', MASTER_KEY, null);
  decipher.setAutoPadding(true);
  return Buffer.concat([decipher.update(wrapped), decipher.final()]);
}

/**
 * SHA256 hex
 */
function sha256hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

module.exports = { aesGcmEncrypt, aesGcmDecrypt, wrapKey, unwrapKey, sha256hex };
