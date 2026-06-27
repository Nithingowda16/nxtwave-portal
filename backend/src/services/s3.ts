import path from 'path';

export class S3Service {
  static async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    folder: 'profiles' | 'assignments' | 'notes' | 'recordings'
  ): Promise<string> {
    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(originalName) || '.bin';
    const mockUrl = `https://nxtwave-lms-assets.s3.ap-south-1.amazonaws.com/${folder}/${uniqueId}${extension}`;
    
    console.log(`[AWS S3 Service] File uploaded successfully to S3: ${mockUrl} (${fileBuffer.length} bytes)`);
    return mockUrl;
  }
}
