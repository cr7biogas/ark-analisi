/**
 * Notify API - Multi-Agent Multi-Camera Analysis
 * Calls Multi-Agent Coordinator for 3-camera video analysis
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
const COORDINATOR_URL = process.env.COORDINATOR_URL || 'http://187.77.96.192:3466/analyze';
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || 'https://copilota-6d94a-default-rtdb.firebaseio.com';

/**
 * Generate presigned URL for R2 object
 */
async function getPresignedUrl(publicUrl) {
  try {
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
 * Update Firebase recording status
 */
async function updateRecordingStatus(analysisId, status) {
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/ark_analisi/recordings/${analysisId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        analyzedAt: Date.now()
      })
    });

    if (!response.ok) {
      console.error(`Firebase status update failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Firebase status update error:', error);
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
      videos // { frontale, lateraleDx, lateraleSx }
    } = req.body;

    if (!analysisId) {
      return res.status(400).json({ error: 'Missing analysisId' });
    }

    // Check if multi-camera
    if (videos && typeof videos === 'object') {
      // Multi-camera workflow
      const { frontale, lateraleDx, lateraleSx } = videos;

      if (!frontale && !lateraleDx && !lateraleSx) {
        return res.status(400).json({ error: 'No video URLs provided' });
      }

      console.log(`[${analysisId}] Multi-camera analysis requested`);
      console.log(`  Frontale: ${frontale ? '✓' : '✗'}`);
      console.log(`  Laterale-DX: ${lateraleDx ? '✓' : '✗'}`);
      console.log(`  Laterale-SX: ${lateraleSx ? '✓' : '✗'}`);

      // Generate presigned URLs for all available cameras
      const presignedVideos = {};
      
      if (frontale) {
        const url = await getPresignedUrl(frontale);
        presignedVideos.frontale = url || frontale;
      }
      
      if (lateraleDx) {
        const url = await getPresignedUrl(lateraleDx);
        presignedVideos.lateraleDx = url || lateraleDx;
      }
      
      if (lateraleSx) {
        const url = await getPresignedUrl(lateraleSx);
        presignedVideos.lateraleSx = url || lateraleSx;
      }

      // Call Multi-Agent Coordinator
      console.log(`[${analysisId}] Calling coordinator: ${COORDINATOR_URL}`);
      
      const coordinatorRes = await fetch(COORDINATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          videos: presignedVideos
        }),
        signal: AbortSignal.timeout(600000) // 10 min timeout
      });

      if (!coordinatorRes.ok) {
        const errorText = await coordinatorRes.text();
        throw new Error(`Coordinator failed: ${coordinatorRes.status} - ${errorText}`);
      }

      const result = await coordinatorRes.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Multi-agent analysis failed');
      }

      console.log(`[${analysisId}] Multi-camera analysis complete. Overall: ${result.overall}`);

      // Update recording status
      await updateRecordingStatus(analysisId, 'analyzed');

      return res.status(200).json({ 
        success: true, 
        analysisId,
        reportUrl: result.reportUrl,
        overall: result.overall,
        scores: result.scores,
        method: 'Multi-Agent (3 cameras)'
      });

    } else {
      // Single-camera fallback (legacy)
      const { videoUrl } = req.body;
      
      if (!videoUrl) {
        return res.status(400).json({ error: 'Missing videoUrl or videos object' });
      }

      console.log(`[${analysisId}] Single-camera analysis (legacy mode)`);
      
      const presignedUrl = await getPresignedUrl(videoUrl);
      const accessibleUrl = presignedUrl || videoUrl;

      // Call single analyzer
      const analyzerUrl = process.env.ANALYZER_URL || 'http://187.77.96.192:3465/analyze';
      
      const analyzerRes = await fetch(analyzerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: accessibleUrl,
          analysisId,
          frameCount: 35
        }),
        signal: AbortSignal.timeout(120000)
      });

      if (!analyzerRes.ok) {
        const errorText = await analyzerRes.text();
        throw new Error(`Analyzer failed: ${analyzerRes.status} - ${errorText}`);
      }

      const analysisResult = await analyzerRes.json();
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'Analysis failed');
      }

      // Save to Firebase
      await fetch(`${FIREBASE_DB_URL}/ark_analisi/reports/${analysisId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...analysisResult,
          analysisId,
          timestamp: Date.now(),
          status: 'completed'
        })
      });

      await updateRecordingStatus(analysisId, 'analyzed');

      return res.status(200).json({ 
        success: true, 
        analysisId,
        reportUrl: `https://ark-analisi.vercel.app/report.html?id=${analysisId}`,
        scores: analysisResult.scores,
        frameCount: analysisResult.frameCount,
        method: 'MediaPipe (single camera)'
      });
    }

  } catch (error) {
    console.error('Notify error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed', 
      details: error.message 
    });
  }
}
