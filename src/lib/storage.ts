/**
 * Storage Provider Interface
 * Allows for easy switching between Local, Cloudinary, and S3
 */
export interface StorageProvider {
  upload(file: Buffer | string, fileName: string): Promise<string>;
  delete(fileUrl: string): Promise<boolean>;
}

/**
 * Local Storage Provider
 * Saves files to public/uploads
 */
import fs from 'fs/promises';
import path from 'path';

export class LocalStorageProvider implements StorageProvider {
  async upload(file: Buffer | string, fileName: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
    const filePath = path.join(uploadDir, uniqueName);

    if (typeof file === 'string') {
      // Handle base64
      const base64Data = file.split(';base64,').pop();
      if (base64Data) {
        await fs.writeFile(filePath, base64Data, { encoding: 'base64' });
      }
    } else {
      await fs.writeFile(filePath, file);
    }

    return `/uploads/${uniqueName}`;
  }

  async delete(fileUrl: string): Promise<boolean> {
    const fileName = fileUrl.split('/').pop();
    if (!fileName) return false;
    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Cloudinary Provider
 * Official cloud storage integration
 */
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryProvider implements StorageProvider {
  async upload(file: Buffer | string, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Cloudinary upload timed out after 60 seconds"));
      }, 60000);

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'aspiremint_orders',
          resource_type: 'auto',
          public_id: fileName.split('.')[0] + '-' + Date.now(),
        },
        (error, result) => {
          clearTimeout(timeout);
          if (error) reject(error);
          else resolve(result?.secure_url || '');
        }
      );

      if (typeof file === 'string') {
        const base64Data = file.split(';base64,').pop();
        if (base64Data) {
          uploadStream.end(Buffer.from(base64Data, 'base64'));
        } else {
          clearTimeout(timeout);
          reject(new Error("Invalid base64 data"));
        }
      } else {
        uploadStream.end(file);
      }
    });
  }

  async delete(fileUrl: string): Promise<boolean> {
    const publicId = fileUrl.split('/').pop()?.split('.')[0];
    if (!publicId) return false;
    try {
      await cloudinary.uploader.destroy(`aspiremint_orders/${publicId}`);
      return true;
    } catch {
      return false;
    }
  }
}

// Current Active Provider
// To switch back to local, use: new LocalStorageProvider();
export const storageProvider: StorageProvider = new CloudinaryProvider();
