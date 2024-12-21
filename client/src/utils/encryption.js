import CryptoJS from 'crypto-js';

/**
 * Generate a key pair for encryption
 * @returns {Promise<{publicKey: string, privateKey: string}>}
 */
export const generateKeyPair = async () => {
  try {
    // Generate a random key pair
    const privateKey = CryptoJS.lib.WordArray.random(32).toString();
    const publicKey = CryptoJS.SHA256(privateKey).toString();

    return {
      publicKey,
      privateKey
    };
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw new Error('Failed to generate encryption keys');
  }
};

/**
 * Encrypt a message
 * @param {string} message - The message to encrypt
 * @param {string} key - The encryption key
 * @returns {string} - The encrypted message
 */
export const encryptMessage = (message, key) => {
  try {
    // Add a random IV for each message
    const iv = CryptoJS.lib.WordArray.random(16);
    
    // Encrypt the message
    const encrypted = CryptoJS.AES.encrypt(message, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Combine IV and encrypted message
    const combined = iv.concat(encrypted.ciphertext);
    
    // Convert to base64 string
    return CryptoJS.enc.Base64.stringify(combined);
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw new Error('Failed to encrypt message');
  }
};

/**
 * Decrypt a message
 * @param {string} encryptedMessage - The encrypted message
 * @param {string} key - The decryption key
 * @returns {string} - The decrypted message
 */
export const decryptMessage = (encryptedMessage, key) => {
  try {
    // Convert from base64
    const combined = CryptoJS.enc.Base64.parse(encryptedMessage);
    
    // Extract IV and ciphertext
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4));
    const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4));
    
    // Create cipher params
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: ciphertext
    });
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Convert to UTF8 string
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw new Error('Failed to decrypt message');
  }
};

/**
 * Hash a password
 * @param {string} password - The password to hash
 * @returns {string} - The hashed password
 */
export const hashPassword = (password) => {
  try {
    return CryptoJS.SHA256(password).toString();
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Generate a random room key
 * @returns {string} - The room key
 */
export const generateRoomKey = () => {
  try {
    return CryptoJS.lib.WordArray.random(32).toString();
  } catch (error) {
    console.error('Error generating room key:', error);
    throw new Error('Failed to generate room key');
  }
};

/**
 * Encrypt a room key with a user's public key
 * @param {string} roomKey - The room key to encrypt
 * @param {string} publicKey - The user's public key
 * @returns {string} - The encrypted room key
 */
export const encryptRoomKey = (roomKey, publicKey) => {
  try {
    return CryptoJS.AES.encrypt(roomKey, publicKey).toString();
  } catch (error) {
    console.error('Error encrypting room key:', error);
    throw new Error('Failed to encrypt room key');
  }
};

/**
 * Decrypt a room key with a user's private key
 * @param {string} encryptedRoomKey - The encrypted room key
 * @param {string} privateKey - The user's private key
 * @returns {string} - The decrypted room key
 */
export const decryptRoomKey = (encryptedRoomKey, privateKey) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedRoomKey, privateKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting room key:', error);
    throw new Error('Failed to decrypt room key');
  }
};

/**
 * Validate encryption keys
 * @param {string} publicKey - The public key to validate
 * @param {string} privateKey - The private key to validate
 * @returns {boolean} - Whether the keys are valid
 */
export const validateKeys = (publicKey, privateKey) => {
  try {
    // Test encryption/decryption with the keys
    const testMessage = 'test';
    const encrypted = encryptMessage(testMessage, publicKey);
    const decrypted = decryptMessage(encrypted, privateKey);
    return decrypted === testMessage;
  } catch (error) {
    console.error('Error validating keys:', error);
    return false;
  }
};
