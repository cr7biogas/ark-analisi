/**
 * Notify API - Sends analysis request to Claude via Bridge (as Eugenio)
 */

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://187.77.96.192:3462/send';
const BRIDGE_TARGET = process.env.BRIDGE_TARGET || '@AnaliticExercise_bot'; // ANALYZER agent

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

    // Build message for Claude (plain text, no markdown)
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

Video: ${videoUrl}

ISTRUZIONI:
1. Estrai 35-40 frame dal video
2. Trova bottom position (frame 15-25)
3. Analizza: profondità, knee cave, asimmetria, stabilità
4. Genera report con scoring 0-100
5. Confronta con score app e valida errori`;

    // Send via Bridge (arrives as Eugenio's message)
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
      message: 'Sent via bridge',
      analysisId
    });

  } catch (error) {
    console.error('Notify error:', error);
    return res.status(500).json({ 
      error: 'Notification failed', 
      details: error.message 
    });
  }
}
