/**
 * Notify API - Sends analysis request to ANALYZER with presigned URL
 */

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
const BRIDGE_URL = process.env.BRIDGE_URL || 'http://187.77.96.192:3462/send';
const BRIDGE_TARGET = process.env.BRIDGE_TARGET || '@AnaliticExercise_bot';

/**
 * Generate presigned URL for R2 object
 */
async function getPresignedUrl(publicUrl) {
  try {
    // Extract key from public URL
    let key = publicUrl;
    if (publicUrl.includes('r2.dev/')) {
      key = publicUrl.split('r2.dev/')[1];
    }
    
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key
    });

    const presignedUrl = await getSignedUrl(R2, command, { 
      expiresIn: 3600 // 1 hour
    });

    return presignedUrl;
  } catch (error) {
    console.error('Presign error:', error);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { 
      analysisId,
      videoUrl,
      athleteName,
      movement,
      position,
      duration,
      appStats,
      reps,
      load,
      cameraView
    } = req.body;

    if (!analysisId || !videoUrl) {
      return res.status(400).json({ error: 'Missing analysisId or videoUrl' });
    }

    // Generate presigned URL for video access
    const presignedUrl = await getPresignedUrl(videoUrl);
    const accessibleUrl = presignedUrl || videoUrl;

    // Build message for ANALYZER
    const message = `🎬 ANALIZZA VIDEO ARK

ID: ${analysisId}
Atleta: ${athleteName || 'Anonimo'}
Movimento: ${movement || 'squat'}
Camera: ${position || 'frontale'}
Vista: ${cameraView || position || 'frontale'}
Durata: ${duration || '??'}
Reps: ${reps || '1'}
Carico: ${load || 'BW'}

Score app: ${appStats?.averageScore || '--'}/100
Errori: ${appStats?.topFaults?.map(f => f.name).join(', ') || 'nessuno'}

Video: ${accessibleUrl}
${presignedUrl ? '(URL valido per 1 ora)' : '(URL pubblico)'}

ISTRUZIONI (segui PROTOCOL.md):
1. Estrai 35 frame: POST http://172.17.0.1:3464/extract-frames
2. Analizza OGNI frame con vision
3. Raccogli dati: angoli, simmetria, errori
4. Rileva outlier (variazioni >25° tra frame)
5. Genera report completo con scores e raccomandazioni`;

    // Send via Bridge
    const bridgeRes = await fetch(BRIDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: BRIDGE_TARGET,
        message: message
      })
    });

    const bridgeData = await bridgeRes.json();
    
    if (!bridgeData.ok) {
      throw new Error(bridgeData.error || 'Bridge failed');
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Analysis request sent',
      analysisId,
      presigned: !!presignedUrl
    });

  } catch (error) {
    console.error('Notify error:', error);
    return res.status(500).json({ 
      error: 'Notification failed', 
      details: error.message 
    });
  }
}
