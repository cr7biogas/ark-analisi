/**
 * ARK Analisi - Pose Engine
 * Wrapper per MediaPipe Pose con utilities per analisi movimento
 */

// MediaPipe Pose Landmarks indices
export const LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32
};

// Skeleton connections for drawing
export const SKELETON_CONNECTIONS = [
  // Torso
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER],
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP],
  [LANDMARKS.RIGHT_SHOULDER, LANDMARKS.RIGHT_HIP],
  [LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP],
  // Left arm
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW],
  [LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
  // Right arm
  [LANDMARKS.RIGHT_SHOULDER, LANDMARKS.RIGHT_ELBOW],
  [LANDMARKS.RIGHT_ELBOW, LANDMARKS.RIGHT_WRIST],
  // Left leg
  [LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE],
  [LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
  [LANDMARKS.LEFT_ANKLE, LANDMARKS.LEFT_HEEL],
  [LANDMARKS.LEFT_ANKLE, LANDMARKS.LEFT_FOOT_INDEX],
  // Right leg
  [LANDMARKS.RIGHT_HIP, LANDMARKS.RIGHT_KNEE],
  [LANDMARKS.RIGHT_KNEE, LANDMARKS.RIGHT_ANKLE],
  [LANDMARKS.RIGHT_ANKLE, LANDMARKS.RIGHT_HEEL],
  [LANDMARKS.RIGHT_ANKLE, LANDMARKS.RIGHT_FOOT_INDEX],
  // Face (minimal)
  [LANDMARKS.LEFT_EAR, LANDMARKS.LEFT_EYE],
  [LANDMARKS.RIGHT_EAR, LANDMARKS.RIGHT_EYE],
  [LANDMARKS.LEFT_EYE, LANDMARKS.NOSE],
  [LANDMARKS.RIGHT_EYE, LANDMARKS.NOSE]
];

/**
 * PoseEngine - Main class for pose detection
 */
export class PoseEngine {
  constructor(options = {}) {
    this.pose = null;
    this.camera = null;
    this.onResults = options.onResults || (() => {});
    this.onReady = options.onReady || (() => {});
    this.isReady = false;
    
    this.config = {
      modelComplexity: options.modelComplexity ?? 1, // 0, 1, or 2
      smoothLandmarks: options.smoothLandmarks ?? true,
      enableSegmentation: options.enableSegmentation ?? false,
      smoothSegmentation: options.smoothSegmentation ?? false,
      minDetectionConfidence: options.minDetectionConfidence ?? 0.5,
      minTrackingConfidence: options.minTrackingConfidence ?? 0.5
    };
    
    // History for smoothing and velocity
    this.history = [];
    this.maxHistory = 30; // ~1 second at 30fps
  }
  
  /**
   * Initialize MediaPipe Pose
   */
  async init() {
    // Load MediaPipe scripts dynamically
    await this._loadScripts();
    
    this.pose = new window.Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });
    
    this.pose.setOptions(this.config);
    
    this.pose.onResults((results) => {
      if (results.poseLandmarks) {
        // Add to history
        this.history.push({
          landmarks: results.poseLandmarks,
          timestamp: Date.now()
        });
        
        // Trim history
        while (this.history.length > this.maxHistory) {
          this.history.shift();
        }
        
        // Enrich results
        const enrichedResults = this._enrichResults(results);
        this.onResults(enrichedResults);
      } else {
        this.onResults({ detected: false, landmarks: null });
      }
    });
    
    await this.pose.initialize();
    this.isReady = true;
    this.onReady();
  }
  
  /**
   * Load MediaPipe scripts
   */
  async _loadScripts() {
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
    ];
    
    for (const src of scripts) {
      if (!document.querySelector(`script[src="${src}"]`)) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.crossOrigin = 'anonymous';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
    }
  }
  
  /**
   * Start camera feed
   */
  async startCamera(videoElement, options = {}) {
    const facingMode = options.facingMode || 'user';
    const width = options.width || 1280;
    const height = options.height || 720;
    
    this.camera = new window.Camera(videoElement, {
      onFrame: async () => {
        if (this.pose && this.isReady) {
          await this.pose.send({ image: videoElement });
        }
      },
      width,
      height,
      facingMode
    });
    
    await this.camera.start();
  }
  
  /**
   * Stop camera
   */
  stopCamera() {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
  }
  
  /**
   * Process a single frame/image
   */
  async processFrame(imageElement) {
    if (!this.pose || !this.isReady) {
      throw new Error('PoseEngine not initialized');
    }
    await this.pose.send({ image: imageElement });
  }
  
  /**
   * Enrich results with additional computed data
   */
  _enrichResults(results) {
    const landmarks = results.poseLandmarks;
    
    return {
      detected: true,
      landmarks,
      worldLandmarks: results.poseWorldLandmarks,
      timestamp: Date.now(),
      
      // Computed metrics
      angles: this._computeAngles(landmarks),
      symmetry: this._computeSymmetry(landmarks),
      velocity: this._computeVelocity(),
      centerOfMass: this._computeCenterOfMass(landmarks),
      
      // Raw for drawing
      _raw: results
    };
  }
  
  /**
   * Compute key joint angles
   */
  _computeAngles(landmarks) {
    const angle = (a, b, c) => {
      const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
      let degrees = Math.abs(radians * 180 / Math.PI);
      if (degrees > 180) degrees = 360 - degrees;
      return Math.round(degrees);
    };
    
    return {
      leftKnee: angle(
        landmarks[LANDMARKS.LEFT_HIP],
        landmarks[LANDMARKS.LEFT_KNEE],
        landmarks[LANDMARKS.LEFT_ANKLE]
      ),
      rightKnee: angle(
        landmarks[LANDMARKS.RIGHT_HIP],
        landmarks[LANDMARKS.RIGHT_KNEE],
        landmarks[LANDMARKS.RIGHT_ANKLE]
      ),
      leftHip: angle(
        landmarks[LANDMARKS.LEFT_SHOULDER],
        landmarks[LANDMARKS.LEFT_HIP],
        landmarks[LANDMARKS.LEFT_KNEE]
      ),
      rightHip: angle(
        landmarks[LANDMARKS.RIGHT_SHOULDER],
        landmarks[LANDMARKS.RIGHT_HIP],
        landmarks[LANDMARKS.RIGHT_KNEE]
      ),
      leftElbow: angle(
        landmarks[LANDMARKS.LEFT_SHOULDER],
        landmarks[LANDMARKS.LEFT_ELBOW],
        landmarks[LANDMARKS.LEFT_WRIST]
      ),
      rightElbow: angle(
        landmarks[LANDMARKS.RIGHT_SHOULDER],
        landmarks[LANDMARKS.RIGHT_ELBOW],
        landmarks[LANDMARKS.RIGHT_WRIST]
      ),
      leftShoulder: angle(
        landmarks[LANDMARKS.LEFT_ELBOW],
        landmarks[LANDMARKS.LEFT_SHOULDER],
        landmarks[LANDMARKS.LEFT_HIP]
      ),
      rightShoulder: angle(
        landmarks[LANDMARKS.RIGHT_ELBOW],
        landmarks[LANDMARKS.RIGHT_SHOULDER],
        landmarks[LANDMARKS.RIGHT_HIP]
      ),
      // Trunk angle (forward lean)
      trunk: this._computeTrunkAngle(landmarks)
    };
  }
  
  /**
   * Compute trunk/torso angle (forward lean)
   */
  _computeTrunkAngle(landmarks) {
    const midShoulder = {
      x: (landmarks[LANDMARKS.LEFT_SHOULDER].x + landmarks[LANDMARKS.RIGHT_SHOULDER].x) / 2,
      y: (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2
    };
    const midHip = {
      x: (landmarks[LANDMARKS.LEFT_HIP].x + landmarks[LANDMARKS.RIGHT_HIP].x) / 2,
      y: (landmarks[LANDMARKS.LEFT_HIP].y + landmarks[LANDMARKS.RIGHT_HIP].y) / 2
    };
    
    // Angle from vertical
    const dx = midShoulder.x - midHip.x;
    const dy = midShoulder.y - midHip.y;
    let angle = Math.atan2(dx, -dy) * 180 / Math.PI; // -dy because y increases downward
    
    return Math.round(angle);
  }
  
  /**
   * Compute left/right symmetry
   */
  _computeSymmetry(landmarks) {
    // Compare corresponding left/right landmarks
    const pairs = [
      [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER],
      [LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP],
      [LANDMARKS.LEFT_KNEE, LANDMARKS.RIGHT_KNEE],
      [LANDMARKS.LEFT_ANKLE, LANDMARKS.RIGHT_ANKLE],
      [LANDMARKS.LEFT_ELBOW, LANDMARKS.RIGHT_ELBOW],
      [LANDMARKS.LEFT_WRIST, LANDMARKS.RIGHT_WRIST]
    ];
    
    // Find midline (average x of hips)
    const midline = (landmarks[LANDMARKS.LEFT_HIP].x + landmarks[LANDMARKS.RIGHT_HIP].x) / 2;
    
    let totalDiff = 0;
    for (const [left, right] of pairs) {
      const leftDist = Math.abs(landmarks[left].x - midline);
      const rightDist = Math.abs(landmarks[right].x - midline);
      totalDiff += Math.abs(leftDist - rightDist);
    }
    
    // Convert to percentage (0 = perfect symmetry, 100 = max asymmetry)
    const avgDiff = totalDiff / pairs.length;
    const symmetryScore = Math.max(0, 100 - avgDiff * 500); // Scale factor
    
    return Math.round(symmetryScore);
  }
  
  /**
   * Compute velocity of key points
   */
  _computeVelocity() {
    if (this.history.length < 2) {
      return { hip: 0, shoulder: 0, wrist: 0 };
    }
    
    const current = this.history[this.history.length - 1];
    const previous = this.history[this.history.length - 2];
    const dt = (current.timestamp - previous.timestamp) / 1000; // seconds
    
    if (dt === 0) return { hip: 0, shoulder: 0, wrist: 0 };
    
    const velocity = (idx) => {
      const curr = current.landmarks[idx];
      const prev = previous.landmarks[idx];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      return Math.sqrt(dx * dx + dy * dy) / dt;
    };
    
    return {
      hip: (velocity(LANDMARKS.LEFT_HIP) + velocity(LANDMARKS.RIGHT_HIP)) / 2,
      shoulder: (velocity(LANDMARKS.LEFT_SHOULDER) + velocity(LANDMARKS.RIGHT_SHOULDER)) / 2,
      wrist: (velocity(LANDMARKS.LEFT_WRIST) + velocity(LANDMARKS.RIGHT_WRIST)) / 2
    };
  }
  
  /**
   * Compute center of mass (simplified)
   */
  _computeCenterOfMass(landmarks) {
    // Weighted average of key body segments
    const weights = {
      [LANDMARKS.LEFT_HIP]: 0.15,
      [LANDMARKS.RIGHT_HIP]: 0.15,
      [LANDMARKS.LEFT_SHOULDER]: 0.1,
      [LANDMARKS.RIGHT_SHOULDER]: 0.1,
      [LANDMARKS.LEFT_KNEE]: 0.1,
      [LANDMARKS.RIGHT_KNEE]: 0.1,
      [LANDMARKS.NOSE]: 0.05
    };
    
    let totalWeight = 0;
    let sumX = 0;
    let sumY = 0;
    
    for (const [idx, weight] of Object.entries(weights)) {
      const lm = landmarks[parseInt(idx)];
      sumX += lm.x * weight;
      sumY += lm.y * weight;
      totalWeight += weight;
    }
    
    return {
      x: sumX / totalWeight,
      y: sumY / totalWeight
    };
  }
  
  /**
   * Get smoothed landmarks (average over last N frames)
   */
  getSmoothedLandmarks(frames = 3) {
    if (this.history.length < frames) {
      return this.history.length > 0 ? this.history[this.history.length - 1].landmarks : null;
    }
    
    const recentFrames = this.history.slice(-frames);
    const smoothed = [];
    
    for (let i = 0; i < 33; i++) {
      let sumX = 0, sumY = 0, sumZ = 0, sumVis = 0;
      for (const frame of recentFrames) {
        sumX += frame.landmarks[i].x;
        sumY += frame.landmarks[i].y;
        sumZ += frame.landmarks[i].z || 0;
        sumVis += frame.landmarks[i].visibility || 0;
      }
      smoothed.push({
        x: sumX / frames,
        y: sumY / frames,
        z: sumZ / frames,
        visibility: sumVis / frames
      });
    }
    
    return smoothed;
  }
  
  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
  }
}

/**
 * SkeletonRenderer - Draw pose skeleton on canvas
 */
export class SkeletonRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.colors = {
      skeleton: options.skeletonColor || '#00d4aa',
      joints: options.jointColor || '#ffffff',
      leftSide: options.leftColor || '#00ff88',
      rightSide: options.rightColor || '#ff8800',
      warning: '#f1c40f',
      danger: '#e94560'
    };
    
    this.jointRadius = options.jointRadius || 5;
    this.lineWidth = options.lineWidth || 3;
  }
  
  /**
   * Clear canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Draw full skeleton
   */
  draw(landmarks, options = {}) {
    if (!landmarks) return;
    
    this.clear();
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Draw connections
    this.ctx.lineWidth = this.lineWidth;
    
    for (const [startIdx, endIdx] of SKELETON_CONNECTIONS) {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      
      if (start.visibility > 0.5 && end.visibility > 0.5) {
        this.ctx.beginPath();
        this.ctx.moveTo(start.x * width, start.y * height);
        this.ctx.lineTo(end.x * width, end.y * height);
        
        // Color based on side
        if (startIdx % 2 === 1 || endIdx % 2 === 1) {
          this.ctx.strokeStyle = this.colors.leftSide; // Left side (odd indices)
        } else {
          this.ctx.strokeStyle = this.colors.rightSide; // Right side (even indices)
        }
        
        this.ctx.stroke();
      }
    }
    
    // Draw joints
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (lm.visibility > 0.5) {
        this.ctx.beginPath();
        this.ctx.arc(lm.x * width, lm.y * height, this.jointRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.colors.joints;
        this.ctx.fill();
      }
    }
    
    // Draw angle annotations if provided
    if (options.angles) {
      this._drawAngles(landmarks, options.angles, width, height);
    }
    
    // Draw center of mass if provided
    if (options.centerOfMass) {
      this._drawCenterOfMass(options.centerOfMass, width, height);
    }
  }
  
  /**
   * Draw angle annotations
   */
  _drawAngles(landmarks, angles, width, height) {
    this.ctx.font = 'bold 14px sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    
    // Knee angles
    if (angles.leftKnee) {
      const knee = landmarks[LANDMARKS.LEFT_KNEE];
      this._drawAngleLabel(knee.x * width - 30, knee.y * height, angles.leftKnee);
    }
    if (angles.rightKnee) {
      const knee = landmarks[LANDMARKS.RIGHT_KNEE];
      this._drawAngleLabel(knee.x * width + 30, knee.y * height, angles.rightKnee);
    }
    
    // Hip angles
    if (angles.leftHip) {
      const hip = landmarks[LANDMARKS.LEFT_HIP];
      this._drawAngleLabel(hip.x * width - 30, hip.y * height, angles.leftHip);
    }
  }
  
  /**
   * Draw angle label
   */
  _drawAngleLabel(x, y, angle) {
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x - 20, y - 10, 40, 20);
    
    // Color based on angle quality
    let color = '#00d4aa';
    if (angle < 70 || angle > 170) color = '#f1c40f';
    if (angle < 45 || angle > 175) color = '#e94560';
    
    this.ctx.fillStyle = color;
    this.ctx.fillText(`${angle}°`, x, y + 5);
  }
  
  /**
   * Draw center of mass indicator
   */
  _drawCenterOfMass(com, width, height) {
    const x = com.x * width;
    const y = com.y * height;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, 10, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 212, 170, 0.5)';
    this.ctx.fill();
    this.ctx.strokeStyle = '#00d4aa';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Crosshair
    this.ctx.beginPath();
    this.ctx.moveTo(x - 15, y);
    this.ctx.lineTo(x + 15, y);
    this.ctx.moveTo(x, y - 15);
    this.ctx.lineTo(x, y + 15);
    this.ctx.stroke();
  }
}

export default PoseEngine;
