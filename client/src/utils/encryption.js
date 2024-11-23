import CryptoJS from 'crypto-js';

export const generateKeyPair = () => {
  // In a real application, you would use a proper asymmetric encryption library
  // This is a simplified version for demonstration
  const privateKey = CryptoJS.lib.WordArray.random(32).toString();
  const publicKey = CryptoJS.lib.WordArray.random(32).toString();
  return { privateKey, publicKey };
};

export const encryptMessage = (message, recipientPublicKey) => {
  const encryptedMessage = CryptoJS.AES.encrypt(message, recipientPublicKey).toString();
  return encryptedMessage;
};

export const decryptMessage = (encryptedMessage, privateKey) => {
  const decryptedBytes = CryptoJS.AES.decrypt(encryptedMessage, privateKey);
  const decryptedMessage = decryptedBytes.toString(CryptoJS.enc.Utf8);
  return decryptedMessage;
};
