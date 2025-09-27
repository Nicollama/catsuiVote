const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

async function generateTotpSecret(name, userEmail){
  const secret = speakeasy.generateSecret({ length: 20, name: `${name} (${userEmail})` });
  const otpAuth = secret.otpauth_url;
  const qrDataUrl = await qrcode.toDataURL(otpAuth);
  return { base32: secret.base32, otpauth: otpAuth, qrDataUrl };
}

function verifyToken(secretBase32, token){
  return speakeasy.totp.verify({ secret: secretBase32, encoding: 'base32', token, window: 1 });
}

module.exports = { generateTotpSecret, verifyToken };
