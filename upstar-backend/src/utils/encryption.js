const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
    this.saltLength = 64; // 512 bits
    
    // Get encryption key from environment or generate one
    this.encryptionKey = this.getOrGenerateKey();
  }

  // Get or generate encryption key
  getOrGenerateKey() {
    const envKey = process.env.ENCRYPTION_KEY;
    if (envKey && envKey.length === 64) {
      return Buffer.from(envKey, 'hex');
    }
    
    // Generate a new key if none exists
    const key = crypto.randomBytes(this.keyLength);
    console.warn('⚠️  No ENCRYPTION_KEY found in environment. Generated new key:', key.toString('hex'));
    console.warn('⚠️  Add this to your .env file: ENCRYPTION_KEY=' + key.toString('hex'));
    return key;
  }

  // Generate salt
  generateSalt() {
    return crypto.randomBytes(this.saltLength);
  }

  // Derive key from password and salt
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha512');
  }

  // Encrypt data
  encrypt(data, password = null) {
    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const salt = this.generateSalt();
      const iv = crypto.randomBytes(this.ivLength);
      
      // Use provided password or default encryption key
      const key = password ? this.deriveKey(password, salt) : this.encryptionKey;
      
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(salt);
      
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  // Decrypt data
  decrypt(encryptedData, password = null) {
    try {
      const { encrypted, salt, iv, tag } = encryptedData;
      
      const saltBuffer = Buffer.from(salt, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');
      
      // Use provided password or default encryption key
      const key = password ? this.deriveKey(password, saltBuffer) : this.encryptionKey;
      
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(saltBuffer);
      decipher.setAuthTag(tagBuffer);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Try to parse as JSON, return as string if it fails
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  // Hash password with salt
  hashPassword(password, salt = null) {
    const saltBuffer = salt || this.generateSalt();
    const hash = crypto.pbkdf2Sync(password, saltBuffer, 100000, 64, 'sha512');
    
    return {
      hash: hash.toString('hex'),
      salt: saltBuffer.toString('hex')
    };
  }

  // Verify password
  verifyPassword(password, hash, salt) {
    const saltBuffer = Buffer.from(salt, 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    const derivedHash = crypto.pbkdf2Sync(password, saltBuffer, 100000, 64, 'sha512');
    
    return crypto.timingSafeEqual(hashBuffer, derivedHash);
  }

  // Generate secure random string
  generateSecureRandom(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate secure token
  generateSecureToken() {
    return crypto.randomBytes(32).toString('base64url');
  }

  // Hash sensitive data for storage (one-way)
  hashSensitiveData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Encrypt file content
  encryptFile(fileBuffer, password = null) {
    const salt = this.generateSalt();
    const iv = crypto.randomBytes(this.ivLength);
    
    const key = password ? this.deriveKey(password, salt) : this.encryptionKey;
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(salt);
    
    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted.toString('base64'),
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  // Decrypt file content
  decryptFile(encryptedData, password = null) {
    const { encrypted, salt, iv, tag } = encryptedData;
    
    const saltBuffer = Buffer.from(salt, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    const tagBuffer = Buffer.from(tag, 'hex');
    const encryptedBuffer = Buffer.from(encrypted, 'base64');
    
    const key = password ? this.deriveKey(password, saltBuffer) : this.encryptionKey;
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(saltBuffer);
    decipher.setAuthTag(tagBuffer);
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final()
    ]);
    
    return decrypted;
  }

  // Encrypt database fields
  encryptDatabaseField(value) {
    if (!value) return null;
    const encrypted = this.encrypt(value);
    return JSON.stringify(encrypted);
  }

  // Decrypt database fields
  decryptDatabaseField(encryptedValue) {
    if (!encryptedValue) return null;
    try {
      const encrypted = JSON.parse(encryptedValue);
      return this.decrypt(encrypted);
    } catch (error) {
      // If decryption fails, return original value (might be unencrypted)
      return encryptedValue;
    }
  }

  // Generate API key
  generateApiKey() {
    const prefix = 'upstar_';
    const randomPart = crypto.randomBytes(32).toString('base64url');
    return prefix + randomPart;
  }

  // Generate JWT secret
  generateJWTSecret() {
    return crypto.randomBytes(64).toString('base64url');
  }

  // Encrypt environment variables
  encryptEnvVar(value) {
    const encrypted = this.encrypt(value);
    return Buffer.from(JSON.stringify(encrypted)).toString('base64');
  }

  // Decrypt environment variables
  decryptEnvVar(encryptedValue) {
    try {
      const encrypted = JSON.parse(Buffer.from(encryptedValue, 'base64').toString());
      return this.decrypt(encrypted);
    } catch (error) {
      throw new Error(`Failed to decrypt environment variable: ${error.message}`);
    }
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

module.exports = encryptionService;





