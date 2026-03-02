/**
 * Notify API - Sends analysis request to Claude via Telegram
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_NOTIFY_CHAT_ID || '1274524612'; // Eugenio's chat

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
      athletePhone // Optional: send report directly to athlete
    } = req.body;

    if (!analysisId || !videoUrl) {
      return res.status(400).json({ error: 'Missing analysisId or videoUrl' });
    }

    // Build message for Claude
    const message = `🎬 **NUOVA ANALISI VIDEO**

📋 **ID:** \`${analysisId}\`
👤 **Atleta:** ${athleteName || 'Anonimo'}
🏋️ **Movimento:** ${movement || 'Non specificato'}
📍 **Posizione camera:** ${position || 'Non specificata'}
⏱️ **Durata:** ${duration || '??'}

📊 **Dati dall'app:**
- Score medio: ${appStats?.averageScore || '--'}
- Score migliore: ${appStats?.bestScore || '--'}
- Ripetizioni: ${appStats?.totalReps || 0}
- Errori rilevati: ${appStats?.topFaults?.map(f => f.name).join(', ') || 'nessuno'}

🎥 **Video:** ${videoUrl}

${athletePhone ? `📱 **Invia report a:** ${athletePhone}` : '📱 **Invia report a:** Eugenio (inoltra manualmente)'}

---
⚡ **AZIONE RICHIESTA:**
1. Analizza il video (scaricalo o usa frame)
2. Confronta con i dati app
3. Crea report in Firebase: \`ark_analisi/reports/${analysisId}\`
4. Invia URL report: https://ark-analisi.vercel.app/report.html?id=${analysisId}`;

    // Send to Telegram
    if (TELEGRAM_BOT_TOKEN) {
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Notification sent',
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
