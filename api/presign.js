import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  }
});

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'fitness-app-videos';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Accept key from query or body
    const key = req.query.key || req.body?.key;

    if (!key) {
      return res.status(400).json({ 
        error: 'Missing key parameter',
        example: '/api/presign?key=ark-analisi/video.webm'
      });
    }

    // Clean key (remove public URL prefix if present)
    let cleanKey = key;
    if (key.includes('r2.dev/')) {
      cleanKey = key.split('r2.dev/')[1];
    }
    if (key.includes('cloudflarestorage.com/')) {
      cleanKey = key.split('/').slice(-2).join('/');
    }

    // Generate presigned URL (valid for 1 hour)
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: cleanKey
    });

    const presignedUrl = await getSignedUrl(R2, command, { 
      expiresIn: 3600 // 1 hour
    });

    return res.status(200).json({ 
      success: true,
      presignedUrl,
      key: cleanKey,
      expiresIn: '1 hour'
    });

  } catch (error) {
    console.error('Presign error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate presigned URL', 
      details: error.message 
    });
  }
}
