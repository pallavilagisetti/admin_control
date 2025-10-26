const AWS = require('aws-sdk');
const { logger } = require('../middleware/errorHandler');

class S3Service {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.bucketName = process.env.AWS_S3_BUCKET;
  }

  // Upload file to S3
  async uploadFile(file, key, metadata = {}) {
    try {
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer || file,
        ContentType: file.mimetype || 'application/octet-stream',
        Metadata: {
          originalName: file.originalname || 'unknown',
          uploadedAt: new Date().toISOString(),
          ...metadata
        }
      };

      const result = await this.s3.upload(uploadParams).promise();
      
      logger.info(`File uploaded to S3: ${key}`);
      return {
        success: true,
        url: result.Location,
        key: result.Key,
        bucket: result.Bucket
      };
    } catch (error) {
      logger.error('S3 upload failed:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  // Download file from S3
  async downloadFile(key) {
    try {
      const downloadParams = {
        Bucket: this.bucketName,
        Key: key
      };

      const result = await this.s3.getObject(downloadParams).promise();
      
      return {
        success: true,
        data: result.Body,
        contentType: result.ContentType,
        metadata: result.Metadata
      };
    } catch (error) {
      logger.error('S3 download failed:', error);
      throw new Error(`File download failed: ${error.message}`);
    }
  }

  // Delete file from S3
  async deleteFile(key) {
    try {
      const deleteParams = {
        Bucket: this.bucketName,
        Key: key
      };

      await this.s3.deleteObject(deleteParams).promise();
      
      logger.info(`File deleted from S3: ${key}`);
      return {
        success: true,
        message: 'File deleted successfully'
      };
    } catch (error) {
      logger.error('S3 delete failed:', error);
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  // Generate signed URL for file access
  async generateSignedUrl(key, expiresIn = 3600) {
    try {
      const signedUrl = this.s3.getSignedUrl('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn
      });

      return {
        success: true,
        url: signedUrl,
        expiresIn: expiresIn
      };
    } catch (error) {
      logger.error('S3 signed URL generation failed:', error);
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }
  }

  // Generate signed URL for file upload
  async generateSignedUploadUrl(key, contentType, expiresIn = 3600) {
    try {
      const signedUrl = this.s3.getSignedUrl('putObject', {
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        Expires: expiresIn
      });

      return {
        success: true,
        url: signedUrl,
        expiresIn: expiresIn
      };
    } catch (error) {
      logger.error('S3 signed upload URL generation failed:', error);
      throw new Error(`Signed upload URL generation failed: ${error.message}`);
    }
  }

  // List files in S3 bucket
  async listFiles(prefix = '', maxKeys = 1000) {
    try {
      const listParams = {
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys
      };

      const result = await this.s3.listObjectsV2(listParams).promise();
      
      return {
        success: true,
        files: result.Contents.map(file => ({
          key: file.Key,
          size: file.Size,
          lastModified: file.LastModified,
          etag: file.ETag
        })),
        count: result.Contents.length,
        isTruncated: result.IsTruncated
      };
    } catch (error) {
      logger.error('S3 list files failed:', error);
      throw new Error(`File listing failed: ${error.message}`);
    }
  }

  // Get file metadata
  async getFileMetadata(key) {
    try {
      const headParams = {
        Bucket: this.bucketName,
        Key: key
      };

      const result = await this.s3.headObject(headParams).promise();
      
      return {
        success: true,
        metadata: {
          contentType: result.ContentType,
          contentLength: result.ContentLength,
          lastModified: result.LastModified,
          etag: result.ETag,
          metadata: result.Metadata
        }
      };
    } catch (error) {
      logger.error('S3 get metadata failed:', error);
      throw new Error(`Metadata retrieval failed: ${error.message}`);
    }
  }

  // Copy file within S3
  async copyFile(sourceKey, destinationKey) {
    try {
      const copyParams = {
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey
      };

      await this.s3.copyObject(copyParams).promise();
      
      logger.info(`File copied in S3: ${sourceKey} -> ${destinationKey}`);
      return {
        success: true,
        message: 'File copied successfully'
      };
    } catch (error) {
      logger.error('S3 copy failed:', error);
      throw new Error(`File copy failed: ${error.message}`);
    }
  }

  // Move file within S3
  async moveFile(sourceKey, destinationKey) {
    try {
      // Copy file
      await this.copyFile(sourceKey, destinationKey);
      
      // Delete original file
      await this.deleteFile(sourceKey);
      
      logger.info(`File moved in S3: ${sourceKey} -> ${destinationKey}`);
      return {
        success: true,
        message: 'File moved successfully'
      };
    } catch (error) {
      logger.error('S3 move failed:', error);
      throw new Error(`File move failed: ${error.message}`);
    }
  }

  // Get S3 bucket statistics
  async getBucketStats() {
    try {
      const listParams = {
        Bucket: this.bucketName,
        MaxKeys: 1000
      };

      const result = await this.s3.listObjectsV2(listParams).promise();
      
      const totalSize = result.Contents.reduce((sum, file) => sum + file.Size, 0);
      const fileCount = result.Contents.length;
      
      return {
        success: true,
        stats: {
          totalFiles: fileCount,
          totalSize: totalSize,
          averageSize: fileCount > 0 ? totalSize / fileCount : 0,
          isTruncated: result.IsTruncated
        }
      };
    } catch (error) {
      logger.error('S3 bucket stats failed:', error);
      throw new Error(`Bucket statistics failed: ${error.message}`);
    }
  }

  // Check if file exists
  async fileExists(key) {
    try {
      await this.s3.headObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();
      
      return true;
    } catch (error) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  // Get file URL
  getFileUrl(key) {
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }

  // Generate file key for different types
  generateFileKey(type, userId, filename) {
    const timestamp = Date.now();
    const extension = filename.split('.').pop();
    
    switch (type) {
      case 'resume':
        return `resumes/${userId}/${timestamp}-${filename}`;
      case 'avatar':
        return `avatars/${userId}/${timestamp}-${filename}`;
      case 'document':
        return `documents/${userId}/${timestamp}-${filename}`;
      case 'temp':
        return `temp/${userId}/${timestamp}-${filename}`;
      default:
        return `uploads/${userId}/${timestamp}-${filename}`;
    }
  }

  // Clean up temporary files
  async cleanupTempFiles(olderThanHours = 24) {
    try {
      const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
      
      const listParams = {
        Bucket: this.bucketName,
        Prefix: 'temp/',
        MaxKeys: 1000
      };

      const result = await this.s3.listObjectsV2(listParams).promise();
      
      const filesToDelete = result.Contents.filter(file => 
        file.LastModified < cutoffTime
      );

      if (filesToDelete.length > 0) {
        const deleteParams = {
          Bucket: this.bucketName,
          Delete: {
            Objects: filesToDelete.map(file => ({ Key: file.Key }))
          }
        };

        await this.s3.deleteObjects(deleteParams).promise();
        
        logger.info(`Cleaned up ${filesToDelete.length} temporary files`);
        return {
          success: true,
          deletedCount: filesToDelete.length
        };
      }

      return {
        success: true,
        deletedCount: 0,
        message: 'No temporary files to clean up'
      };
    } catch (error) {
      logger.error('S3 cleanup failed:', error);
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }
}

module.exports = new S3Service();





