import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  }
});

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'fitness-app-videos';
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-f48312e5f4db44fe9e0db66529f43d7f.r2.dev';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb' // Video files can be large
    }
  }
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { video, filename, metadata } = req.body;

    if (!video) {
      return res.status(400).json({ error: 'Missing video data' });
    }

    // Handle base64 data URL
    let base64Data = video;
    let contentType = 'video/webm';
    
    if (video.startsWith('data:')) {
      const match = video.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contentType = match[1];
        base64Data = match[2];
      }
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const ext = contentType.includes('webm') ? 'webm' : 'mp4';
    
    // Remove existing extension if present to avoid double extension
    let baseName = filename || `video_${timestamp}`;
    baseName = baseName.replace(/\.(webm|mp4|mov|avi)$/i, '');
    
    const key = `ark-analisi/${baseName}.${ext}`;

    // Upload to R2
    await R2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
      Metadata: metadata ? JSON.stringify(metadata) : undefined
    }));

    const url = `${PUBLIC_URL}/${key}`;

    return res.status(200).json({ 
      success: true, 
      url,
      key,
      size: buffer.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message 
    });
  }
}
