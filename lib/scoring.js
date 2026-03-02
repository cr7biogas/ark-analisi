/**
 * ARK Analisi - Scoring System
 * Calculate and track movement quality scores
 */

import { getMovement, detectPhase, checkFaults } from './movement-db.js';

/**
 * ScoreCalculator - Main scoring engine
 */
export class ScoreCalculator {
  constructor(movementId, options = {}) {
    this.movementId = movementId;
    this.movement = getMovement(movementId);
    
    this.options = {
      smoothingFrames: options.smoothingFrames || 5,
      faultPenalty: options.faultPenalty || 10,
      ...options
    };
    
    // Score history for smoothing
    this.scoreHistory = [];
    this.maxHistory = 100;
    
    // Rep tracking
    this.repCount = 0;
    this.repScores = [];
    this.currentRepScore = 0;
    this.currentPhase = null;
    this.lastPhase = null;
    
    // Fault tracking
    this.faultHistory = [];
    this.faultCounts = {};
    
    // Best/worst tracking
    this.bestScore = 0;
    this.worstScore = 100;
    this.totalFrames = 0;
  }
  
  /**
   * Process a single frame and return scores
   */
  process(poseResults) {
    if (!poseResults.detected || !poseResults.angles) {
      return this._getEmptyScore();
    }
    
    this.totalFrames++;
    
    // Detect current phase
    const phase = detectPhase(this.movementId, poseResults);
    this.currentPhase = phase;
    
    // Check for faults
    const faults = checkFaults(this.movementId, poseResults);
    this._trackFaults(faults);
    
    // Calculate component scores
    const scores = {
      angles: this._scoreAngles(poseResults, phase),
      symmetry: poseResults.symmetry || 0,
      stability: this._scoreStability(poseResults),
      tempo: this._scoreTempo(poseResults)
    };
    
    // Calculate weighted total
    const weights = this.movement?.scoring || {
      angles: { weight: 0.4 },
      symmetry: { weight: 0.3 },
      stability: { weight: 0.2 },
      tempo: { weight: 0.1 }
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [component, config] of Object.entries(weights)) {
      const score = scores[component] || scores.angles; // Fallback to angles
      totalScore += score * (config.weight || 0.25);
      totalWeight += config.weight || 0.25;
    }
    
    // Normalize
    if (totalWeight > 0) {
      totalScore = totalScore / totalWeight;
    }
    
    // Apply fault penalties
    const faultPenalty = faults.length * this.options.faultPenalty;
    totalScore = Math.max(0, totalScore - faultPenalty);
    
    // Track history
    this.scoreHistory.push(totalScore);
    while (this.scoreHistory.length > this.maxHistory) {
      this.scoreHistory.shift();
    }
    
    // Update best/worst
    if (totalScore > this.bestScore) this.bestScore = totalScore;
    if (totalScore < this.worstScore) this.worstScore = totalScore;
    
    // Rep detection
    this._detectRep(phase);
    
    // Smooth the score
    const smoothedScore = this._smoothScore(totalScore);
    
    return {
      score: Math.round(smoothedScore),
      rawScore: Math.round(totalScore),
      components: scores,
      phase: phase?.name || 'unknown',
      phaseScore: phase?.matchScore || 0,
      faults,
      repCount: this.repCount,
      repScores: this.repScores,
      stats: this.getStats()
    };
  }
  
  /**
   * Score based on angle accuracy
   */
  _scoreAngles(results, phase) {
    if (!phase?.angles || Object.keys(phase.angles).length === 0) {
      // No specific angles for this phase, give default score
      return 75;
    }
    
    let totalScore = 0;
    let angleCount = 0;
    
    for (const [angleName, target] of Object.entries(phase.angles)) {
      const actual = results.angles[angleName];
      if (actual !== undefined) {
        const diff = Math.abs(actual - target.ideal);
        
        // Perfect = 100, at tolerance = 50, beyond tolerance = lower
        let score;
        if (diff <= target.tolerance * 0.5) {
          score = 100; // Within half tolerance = perfect
        } else if (diff <= target.tolerance) {
          score = 100 - (diff / target.tolerance) * 50; // 50-100 range
        } else {
          score = Math.max(0, 50 - (diff - target.tolerance) * 2); // Below 50
        }
        
        // Check minimum constraint if exists
        if (target.min !== undefined && actual > target.min) {
          // Penalize if above minimum (e.g., squat not deep enough)
          score = Math.min(score, 60);
        }
        
        totalScore += score;
        angleCount++;
      }
    }
    
    return angleCount > 0 ? totalScore / angleCount : 75;
  }
  
  /**
   * Score stability (low variance = high score)
   */
  _scoreStability(results) {
    if (this.scoreHistory.length < 5) return 80;
    
    // Calculate variance of center of mass
    const recent = this.scoreHistory.slice(-10);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recent.length;
    const stdDev = Math.sqrt(variance);
    
    // Low stdDev = high stability = high score
    // stdDev of 0 = 100, stdDev of 20+ = 0
    return Math.max(0, 100 - stdDev * 5);
  }
  
  /**
   * Score tempo/speed
   */
  _scoreTempo(results) {
    // Ideal velocity depends on phase
    // For now, penalize extreme speeds
    const hipVelocity = results.velocity?.hip || 0;
    
    // Too fast or too slow = penalty
    if (hipVelocity > 1) {
      return Math.max(0, 100 - (hipVelocity - 1) * 50);
    }
    if (hipVelocity < 0.1) {
      return 90; // Holding still is okay
    }
    
    return 85; // Normal speed
  }
  
  /**
   * Track faults
   */
  _trackFaults(faults) {
    for (const fault of faults) {
      this.faultCounts[fault.name] = (this.faultCounts[fault.name] || 0) + 1;
      this.faultHistory.push({
        ...fault,
        timestamp: Date.now(),
        frame: this.totalFrames
      });
    }
    
    // Keep history manageable
    while (this.faultHistory.length > 500) {
      this.faultHistory.shift();
    }
  }
  
  /**
   * Detect rep completion
   */
  _detectRep(phase) {
    if (!phase) return;
    
    // Simple rep detection: back to starting phase
    const startPhases = ['standing', 'hang', 'rack', 'setup', 'hold'];
    const bottomPhases = ['bottom', 'top', 'lockout'];
    
    // Track if we've seen a "bottom" phase
    if (bottomPhases.includes(phase.name)) {
      this._seenBottom = true;
      this.currentRepScore = Math.max(this.currentRepScore, phase.matchScore || 0);
    }
    
    // If we're back at start and saw bottom, that's a rep
    if (startPhases.includes(phase.name) && this._seenBottom) {
      this.repCount++;
      this.repScores.push(Math.round(this.currentRepScore));
      this.currentRepScore = 0;
      this._seenBottom = false;
    }
    
    this.lastPhase = phase;
  }
  
  /**
   * Smooth score over recent frames
   */
  _smoothScore(currentScore) {
    if (this.scoreHistory.length < this.options.smoothingFrames) {
      return currentScore;
    }
    
    const recent = this.scoreHistory.slice(-this.options.smoothingFrames);
    return recent.reduce((a, b) => a + b, 0) / recent.length;
  }
  
  /**
   * Get empty score object
   */
  _getEmptyScore() {
    return {
      score: 0,
      rawScore: 0,
      components: { angles: 0, symmetry: 0, stability: 0, tempo: 0 },
      phase: 'no detection',
      phaseScore: 0,
      faults: [],
      repCount: this.repCount,
      repScores: this.repScores,
      stats: this.getStats()
    };
  }
  
  /**
   * Get overall statistics
   */
  getStats() {
    const avgScore = this.scoreHistory.length > 0
      ? this.scoreHistory.reduce((a, b) => a + b, 0) / this.scoreHistory.length
      : 0;
    
    const avgRepScore = this.repScores.length > 0
      ? this.repScores.reduce((a, b) => a + b, 0) / this.repScores.length
      : 0;
    
    // Most common faults
    const topFaults = Object.entries(this.faultCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
    
    return {
      averageScore: Math.round(avgScore),
      bestScore: Math.round(this.bestScore),
      worstScore: Math.round(this.worstScore),
      totalReps: this.repCount,
      averageRepScore: Math.round(avgRepScore),
      topFaults,
      totalFrames: this.totalFrames
    };
  }
  
  /**
   * Reset all tracking
   */
  reset() {
    this.scoreHistory = [];
    this.repCount = 0;
    this.repScores = [];
    this.currentRepScore = 0;
    this.currentPhase = null;
    this.lastPhase = null;
    this.faultHistory = [];
    this.faultCounts = {};
    this.bestScore = 0;
    this.worstScore = 100;
    this.totalFrames = 0;
    this._seenBottom = false;
  }
}

/**
 * Generate feedback messages based on score
 */
export function generateFeedback(scoreResult) {
  const messages = [];
  
  // Overall score feedback
  if (scoreResult.score >= 90) {
    messages.push({ type: 'success', icon: '🌟', text: 'Eccellente! Esecuzione perfetta.' });
  } else if (scoreResult.score >= 75) {
    messages.push({ type: 'good', icon: '✅', text: 'Buona esecuzione. Continua così!' });
  } else if (scoreResult.score >= 60) {
    messages.push({ type: 'warning', icon: '⚡', text: 'Discreto. Puoi migliorare.' });
  } else if (scoreResult.score >= 40) {
    messages.push({ type: 'warning', icon: '⚠️', text: 'Attenzione alla tecnica.' });
  } else {
    messages.push({ type: 'bad', icon: '🔴', text: 'Rivedi la tecnica base.' });
  }
  
  // Fault-specific feedback
  for (const fault of scoreResult.faults) {
    messages.push({
      type: fault.severity === 'high' ? 'bad' : 'warning',
      icon: fault.severity === 'high' ? '🔴' : '⚠️',
      text: fault.feedback
    });
  }
  
  // Component-specific feedback
  if (scoreResult.components.symmetry < 70) {
    messages.push({
      type: 'warning',
      icon: '⚖️',
      text: 'Migliora la simmetria sinistra-destra.'
    });
  }
  
  if (scoreResult.components.stability < 70) {
    messages.push({
      type: 'warning',
      icon: '🎯',
      text: 'Lavora sulla stabilità. Meno oscillazioni.'
    });
  }
  
  return messages;
}

/**
 * Get letter grade from score
 */
export function getGrade(score) {
  if (score >= 95) return { grade: 'S', color: '#ffd700' };
  if (score >= 90) return { grade: 'A+', color: '#00d4aa' };
  if (score >= 85) return { grade: 'A', color: '#00d4aa' };
  if (score >= 80) return { grade: 'B+', color: '#2ecc71' };
  if (score >= 75) return { grade: 'B', color: '#2ecc71' };
  if (score >= 70) return { grade: 'C+', color: '#f1c40f' };
  if (score >= 60) return { grade: 'C', color: '#f1c40f' };
  if (score >= 50) return { grade: 'D', color: '#e67e22' };
  return { grade: 'F', color: '#e94560' };
}

export default ScoreCalculator;
