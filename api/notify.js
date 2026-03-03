/**
 * Notify API - Calls Advanced Analyzer directly with presigned URL
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
const ANALYZER_URL = process.env.ANALYZER_URL || 'http://187.77.96.192:3465/analyze';
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || 'https://copilota-6d94a-default-rtdb.firebaseio.com';

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

/**
 * Save analysis to Firebase Realtime Database
 */
async function saveToFirebase(analysisId, analysisData) {
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/ark_analisi/reports/${analysisId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...analysisData,
        analysisId,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        status: 'completed'
      })
    });

    if (!response.ok) {
      throw new Error(`Firebase save failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Firebase save error:', error);
    throw error;
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

    // Call Advanced Analyzer directly
    console.log(`[${analysisId}] Calling analyzer: ${ANALYZER_URL}`);
    
    const analyzerRes = await fetch(ANALYZER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl: accessibleUrl,
        analysisId,
        frameCount: 35
      }),
      signal: AbortSignal.timeout(120000) // 2 min timeout
    });

    if (!analyzerRes.ok) {
      const errorText = await analyzerRes.text();
      throw new Error(`Analyzer failed: ${analyzerRes.status} - ${errorText}`);
    }

    const analysisResult = await analyzerRes.json();
    
    if (!analysisResult.success) {
      throw new Error(analysisResult.error || 'Analysis failed');
    }

    console.log(`[${analysisId}] Analysis complete. Frames: ${analysisResult.frameCount}, Score: ${analysisResult.scores?.overall || '?'}`);

    // Save to Firebase
    await saveToFirebase(analysisId, analysisResult);
    console.log(`[${analysisId}] Saved to Firebase`);

    // Return success with report URL
    return res.status(200).json({ 
      success: true, 
      analysisId,
      reportUrl: `https://ark-analisi.vercel.app/report.html?id=${analysisId}`,
      scores: analysisResult.scores,
      frameCount: analysisResult.frameCount,
      method: 'MediaPipe'
    });

  } catch (error) {
    console.error('Notify error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed', 
      details: error.message 
    });
  }
}
