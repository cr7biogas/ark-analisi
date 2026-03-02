# 🎯 ARK Analisi

Sistema di analisi posturale e valutazione esecuzione movimenti in tempo reale.

## 🏗️ Architettura

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARK ANALISI                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📱 CAPTURE          🧠 PROCESSING           📊 OUTPUT          │
│  ─────────          ───────────             ─────────           │
│                                                                  │
│  ┌──────────┐      ┌──────────────┐      ┌──────────────┐      │
│  │ Camera   │      │  MediaPipe   │      │  Dashboard   │      │
│  │ WebRTC   │─────▶│  Pose        │─────▶│  Scores      │      │
│  │          │      │  Estimation  │      │  Feedback    │      │
│  └──────────┘      └──────────────┘      └──────────────┘      │
│       │                   │                     │               │
│       │            ┌──────┴──────┐              │               │
│       │            │             │              │               │
│       ▼            ▼             ▼              ▼               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐       │
│  │ Multi-   │ │ Angle    │ │ Pattern  │ │ History &    │       │
│  │ Camera   │ │ Analysis │ │ Matching │ │ Progress     │       │
│  │ Sync     │ │          │ │          │ │              │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Struttura File

```
ark-analisi/
├── index.html              # Dashboard principale
├── camera.html             # Cattura video (telefono/webcam)
├── analisi.html            # Analisi live con AI
├── coach.html              # Vista coach (multi-atleta)
├── replay.html             # Replay e analisi video registrato
├── firebase-config.js      # Configurazione Firebase
├── assets/
│   └── css/
│       └── style.css       # Stili
├── lib/
│   ├── pose-engine.js      # Wrapper MediaPipe/MoveNet
│   ├── angle-utils.js      # Calcolo angoli articolari
│   ├── movement-db.js      # Database movimenti reference
│   └── scoring.js          # Sistema di scoring
└── api/
    └── analyze.js          # API serverless (opzionale)
```

## 🧠 Pipeline AI

### Opzioni Pose Estimation

| Tool | Pro | Contro | Use Case |
|------|-----|--------|----------|
| **MediaPipe Pose** | Leggero, browser-native, 33 keypoints | Meno preciso su occlusioni | ✅ Raccomandato |
| **MoveNet Lightning** | Velocissimo, TensorFlow.js | Solo 17 keypoints | Mobile/real-time |
| **MoveNet Thunder** | Più accurato | Più pesante | Analisi dettagliata |
| **BlazePose** | 3D landmarks | Sperimentale | Analisi 3D |
| **OpenPose** | Gold standard | Richiede server GPU | Post-processing |

### Keypoints MediaPipe (33 punti)

```
        0: nose
    1,2: left/right eye (inner)
    3,4: left/right eye
    5,6: left/right eye (outer)
    7,8: left/right ear
   9,10: left/right mouth
  11,12: left/right shoulder
  13,14: left/right elbow
  15,16: left/right wrist
  17-22: left/right hand (pinky, index, thumb)
  23,24: left/right hip
  25,26: left/right knee
  27,28: left/right ankle
  29-32: left/right foot (heel, index)
```

## 📐 Metriche Analizzate

### Angoli Articolari
- Ginocchio (squat depth)
- Anca (hip hinge)
- Spalla (overhead position)
- Gomito (arm bend)
- Caviglia (dorsiflexion)
- Colonna (spinal alignment)

### Postura
- Simmetria sinistra/destra
- Allineamento verticale
- Centro di massa
- Inclinazione pelvi
- Cifosi/lordosi

### Movimento
- Velocità fase concentrica/eccentrica
- Tempo sotto tensione
- Range of motion (ROM)
- Stabilità (oscillazioni)
- Traiettoria barra/corpo

## 🎯 Movimenti Supportati (v1)

1. **Squat** - Back squat, front squat, overhead squat
2. **Deadlift** - Conventional, sumo, Romanian
3. **Press** - Strict press, push press, bench press
4. **Pull** - Pull-up, muscle-up, row
5. **Olympic** - Clean, snatch, jerk

## 🚀 Quick Start

1. Apri `index.html` su PC (dashboard coach)
2. Apri `camera.html` su telefono (scansiona QR)
3. Seleziona movimento da analizzare
4. Esegui - ricevi feedback real-time

## 🔧 Configurazione

Crea `firebase-config.js` con le tue credenziali Firebase.

## 📊 Scoring System

```
SCORE = (Angoli × 0.4) + (Simmetria × 0.3) + (Stabilità × 0.2) + (Tempo × 0.1)

Angoli:     Differenza da angoli ideali
Simmetria:  Bilanciamento left/right
Stabilità:  Varianza posizione nel tempo
Tempo:      Rispetto tempo target fase
```
