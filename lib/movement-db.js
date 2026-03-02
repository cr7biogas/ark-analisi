/**
 * ARK Analisi - Movement Database
 * Reference data for movement analysis - EXTENDED VERSION
 */

import { LANDMARKS } from './pose-engine.js';

/**
 * Movement phases and ideal angles for common exercises
 */
export const MOVEMENTS = {
  
  // ============== SQUAT VARIATIONS ==============
  squat: {
    name: 'Back Squat',
    icon: '🏋️',
    category: 'lower',
    difficulty: 'intermediate',
    
    phases: {
      standing: {
        name: 'Standing',
        duration: [0, 0.15],
        angles: {
          leftKnee: { ideal: 175, tolerance: 10 },
          rightKnee: { ideal: 175, tolerance: 10 },
          leftHip: { ideal: 175, tolerance: 10 },
          rightHip: { ideal: 175, tolerance: 10 },
          trunk: { ideal: 0, tolerance: 10 }
        }
      },
      descent: {
        name: 'Descent',
        duration: [0.15, 0.45],
        angles: { trunk: { ideal: 45, tolerance: 15 } }
      },
      bottom: {
        name: 'Bottom',
        duration: [0.45, 0.55],
        angles: {
          leftKnee: { ideal: 80, tolerance: 15, min: 60 },
          rightKnee: { ideal: 80, tolerance: 15, min: 60 },
          leftHip: { ideal: 70, tolerance: 15 },
          rightHip: { ideal: 70, tolerance: 15 },
          trunk: { ideal: 45, tolerance: 20 }
        }
      },
      ascent: { name: 'Ascent', duration: [0.55, 0.85], angles: {} },
      lockout: {
        name: 'Lockout',
        duration: [0.85, 1.0],
        angles: {
          leftKnee: { ideal: 175, tolerance: 10 },
          rightKnee: { ideal: 175, tolerance: 10 },
          leftHip: { ideal: 175, tolerance: 10 },
          rightHip: { ideal: 175, tolerance: 10 }
        }
      }
    },
    
    faults: [
      {
        name: 'Knee Cave',
        description: 'Ginocchia verso l\'interno',
        severity: 'high',
        check: (results) => {
          const leftKnee = results.landmarks[LANDMARKS.LEFT_KNEE];
          const leftAnkle = results.landmarks[LANDMARKS.LEFT_ANKLE];
          const rightKnee = results.landmarks[LANDMARKS.RIGHT_KNEE];
          const rightAnkle = results.landmarks[LANDMARKS.RIGHT_ANKLE];
          return leftKnee.x > leftAnkle.x + 0.02 || rightKnee.x < rightAnkle.x - 0.02;
        },
        feedback: '⚠️ Le ginocchia stanno cedendo verso l\'interno. Spingi le ginocchia in fuori!'
      },
      {
        name: 'Forward Lean',
        description: 'Eccessiva inclinazione del busto',
        severity: 'medium',
        check: (results) => Math.abs(results.angles.trunk) > 60,
        feedback: '⚠️ Busto troppo inclinato. Petto alto!'
      },
      {
        name: 'Shallow Depth',
        description: 'Squat non sotto al parallelo',
        severity: 'medium',
        check: (results) => {
          const avgKnee = (results.angles.leftKnee + results.angles.rightKnee) / 2;
          return avgKnee > 100;
        },
        feedback: '⚠️ Scendi di più! Cerca di arrivare sotto il parallelo.'
      },
      {
        name: 'Asymmetry',
        description: 'Movimento asimmetrico',
        severity: 'low',
        check: (results) => results.symmetry < 75,
        feedback: '⚠️ Movimento asimmetrico. Bilancia il peso.'
      }
    ],
    
    scoring: { depth: { weight: 0.3 }, symmetry: { weight: 0.25 }, trunk: { weight: 0.25 }, stability: { weight: 0.2 } }
  },
  
  frontSquat: {
    name: 'Front Squat',
    icon: '🏋️',
    category: 'lower',
    difficulty: 'advanced',
    
    phases: {
      rack: {
        name: 'Rack Position',
        duration: [0, 0.15],
        angles: {
          leftElbow: { ideal: 90, tolerance: 20 },
          rightElbow: { ideal: 90, tolerance: 20 },
          trunk: { ideal: 0, tolerance: 5 }
        }
      },
      bottom: {
        name: 'Bottom',
        duration: [0.4, 0.6],
        angles: {
          leftKnee: { ideal: 75, tolerance: 15 },
          rightKnee: { ideal: 75, tolerance: 15 },
          trunk: { ideal: 10, tolerance: 15 } // More upright than back squat
        }
      },
      lockout: {
        name: 'Lockout',
        duration: [0.85, 1.0],
        angles: {
          leftKnee: { ideal: 175, tolerance: 10 },
          rightKnee: { ideal: 175, tolerance: 10 }
        }
      }
    },
    
    faults: [
      {
        name: 'Elbow Drop',
        description: 'Gomiti che scendono',
        severity: 'high',
        check: (results) => {
          const avgElbow = (results.angles.leftElbow + results.angles.rightElbow) / 2;
          return avgElbow < 60;
        },
        feedback: '🔴 Gomiti alti! Mantieni i gomiti paralleli al pavimento.'
      },
      {
        name: 'Forward Collapse',
        description: 'Busto che cade in avanti',
        severity: 'high',
        check: (results) => results.angles.trunk > 30,
        feedback: '🔴 Stai cedendo in avanti. Core stretto, petto alto!'
      }
    ],
    
    scoring: { elbows: { weight: 0.3 }, trunk: { weight: 0.3 }, depth: { weight: 0.25 }, symmetry: { weight: 0.15 } }
  },
  
  overheadSquat: {
    name: 'Overhead Squat',
    icon: '🏋️',
    category: 'lower',
    difficulty: 'advanced',
    
    phases: {
      standing: {
        name: 'Overhead Position',
        duration: [0, 0.15],
        angles: {
          leftElbow: { ideal: 180, tolerance: 10 },
          rightElbow: { ideal: 180, tolerance: 10 },
          leftShoulder: { ideal: 180, tolerance: 15 },
          rightShoulder: { ideal: 180, tolerance: 15 }
        }
      },
      bottom: {
        name: 'Bottom',
        duration: [0.4, 0.6],
        angles: {
          leftKnee: { ideal: 70, tolerance: 15 },
          rightKnee: { ideal: 70, tolerance: 15 },
          trunk: { ideal: 20, tolerance: 15 }
        }
      }
    },
    
    faults: [
      {
        name: 'Arms Forward',
        description: 'Braccia in avanti',
        severity: 'high',
        check: (results) => {
          const wrist = results.landmarks[LANDMARKS.LEFT_WRIST];
          const shoulder = results.landmarks[LANDMARKS.LEFT_SHOULDER];
          return wrist.x > shoulder.x + 0.1;
        },
        feedback: '🔴 Braccia indietro! Spingi il bilanciere verso la nuca.'
      }
    ],
    
    scoring: { overhead: { weight: 0.35 }, depth: { weight: 0.25 }, trunk: { weight: 0.25 }, symmetry: { weight: 0.15 } }
  },

  gobletSquat: {
    name: 'Goblet Squat',
    icon: '🏋️',
    category: 'lower',
    difficulty: 'beginner',
    
    phases: {
      standing: {
        name: 'Standing',
        duration: [0, 0.15],
        angles: {
          leftElbow: { ideal: 45, tolerance: 20 },
          rightElbow: { ideal: 45, tolerance: 20 }
        }
      },
      bottom: {
        name: 'Bottom',
        duration: [0.4, 0.6],
        angles: {
          leftKnee: { ideal: 80, tolerance: 15 },
          rightKnee: { ideal: 80, tolerance: 15 },
          trunk: { ideal: 15, tolerance: 15 }
        }
      }
    },
    
    faults: [
      {
        name: 'Weight Away',
        description: 'Peso lontano dal corpo',
        severity: 'medium',
        check: (results) => {
          const elbow = results.landmarks[LANDMARKS.LEFT_ELBOW];
          const hip = results.landmarks[LANDMARKS.LEFT_HIP];
          return Math.abs(elbow.x - hip.x) > 0.15;
        },
        feedback: '⚠️ Tieni il peso vicino al petto!'
      }
    ],
    
    scoring: { depth: { weight: 0.35 }, trunk: { weight: 0.3 }, symmetry: { weight: 0.35 } }
  },
  
  // ============== DEADLIFT VARIATIONS ==============
  deadlift: {
    name: 'Deadlift',
    icon: '💪',
    category: 'lower',
    difficulty: 'intermediate',
    
    phases: {
      setup: {
        name: 'Setup',
        duration: [0, 0.1],
        angles: {
          leftKnee: { ideal: 120, tolerance: 20 },
          rightKnee: { ideal: 120, tolerance: 20 },
          leftHip: { ideal: 90, tolerance: 15 },
          rightHip: { ideal: 90, tolerance: 15 },
          trunk: { ideal: 45, tolerance: 15 }
        }
      },
      pull: { name: 'Pull', duration: [0.1, 0.6], angles: {} },
      lockout: {
        name: 'Lockout',
        duration: [0.6, 1.0],
        angles: {
          leftKnee: { ideal: 180, tolerance: 5 },
          rightKnee: { ideal: 180, tolerance: 5 },
          leftHip: { ideal: 180, tolerance: 5 },
          rightHip: { ideal: 180, tolerance: 5 },
          trunk: { ideal: 0, tolerance: 5 }
        }
      }
    },
    
    faults: [
      {
        name: 'Round Back',
        description: 'Schiena arrotondata',
        severity: 'high',
        check: (results) => {
          const shoulder = results.landmarks[LANDMARKS.LEFT_SHOULDER];
          const hip = results.landmarks[LANDMARKS.LEFT_HIP];
          return shoulder.y > hip.y + 0.1;
        },
        feedback: '🔴 STOP! Schiena arrotondata. Petto alto, schiena piatta!'
      },
      {
        name: 'Hips Rise First',
        description: 'Le anche si alzano prima delle spalle',
        severity: 'medium',
        check: (results) => results.velocity?.hip > results.velocity?.shoulder * 1.5,
        feedback: '⚠️ Le anche si alzano troppo velocemente. Spingi con le gambe!'
      },
      {
        name: 'Bar Away',
        description: 'Bilanciere lontano dal corpo',
        severity: 'medium',
        check: (results) => {
          const wrist = results.landmarks[LANDMARKS.LEFT_WRIST];
          const knee = results.landmarks[LANDMARKS.LEFT_KNEE];
          return Math.abs(wrist.x - knee.x) > 0.1;
        },
        feedback: '⚠️ Tieni il bilanciere vicino al corpo!'
      }
    ],
    
    scoring: { backPosition: { weight: 0.4 }, symmetry: { weight: 0.2 }, hipHinge: { weight: 0.25 }, lockout: { weight: 0.15 } }
  },
  
  romanianDeadlift: {
    name: 'Romanian Deadlift',
    icon: '💪',
    category: 'lower',
    difficulty: 'intermediate',
    
    phases: {
      standing: {
        name: 'Standing',
        duration: [0, 0.15],
        angles: {
          leftKnee: { ideal: 170, tolerance: 10 },
          rightKnee: { ideal: 170, tolerance: 10 }
        }
      },
      bottom: {
        name: 'Stretch',
        duration: [0.4, 0.6],
        angles: {
          leftHip: { ideal: 90, tolerance: 20 },
          rightHip: { ideal: 90, tolerance: 20 },
          leftKnee: { ideal: 160, tolerance: 15 }, // Slight bend
          trunk: { ideal: 80, tolerance: 15 } // Nearly horizontal
        }
      }
    },
    
    faults: [
      {
        name: 'Too Much Knee Bend',
        description: 'Troppa flessione del ginocchio',
        severity: 'medium',
        check: (results) => {
          const avgKnee = (results.angles.leftKnee + results.angles.rightKnee) / 2;
          return avgKnee < 140;
        },
        feedback: '⚠️ Ginocchia troppo piegate. RDL = anche, non ginocchia!'
      },
      {
        name: 'Round Back',
        description: 'Schiena arrotondata',
        severity: 'high',
        check: (results) => {
          const shoulder = results.landmarks[LANDMARKS.LEFT_SHOULDER];
          const hip = results.landmarks[LANDMARKS.LEFT_HIP];
          return shoulder.y > hip.y + 0.15;
        },
        feedback: '🔴 Schiena piatta! Spingi il petto fuori.'
      }
    ],
    
    scoring: { hamstringStretch: { weight: 0.35 }, backPosition: { weight: 0.35 }, knees: { weight: 0.3 } }
  },
  
  sumoDeadlift: {
    name: 'Sumo Deadlift',
    icon: '💪',
    category: 'lower',
    difficulty: 'intermediate',
    
    phases: {
      setup: {
        name: 'Wide Stance Setup',
        duration: [0, 0.15],
        angles: {
          leftKnee: { ideal: 100, tolerance: 20 },
          rightKnee: { ideal: 100, tolerance: 20 },
          trunk: { ideal: 20, tolerance: 15 } // More upright
        }
      },
      lockout: {
        name: 'Lockout',
        duration: [0.7, 1.0],
        angles: {
          leftHip: { ideal: 180, tolerance: 5 },
          rightHip: { ideal: 180, tolerance: 5 }
        }
      }
    },
    
    faults: [
      {
        name: 'Knees Cave',
        description: 'Ginocchia che cedono',
        severity: 'high',
        check: (results) => results.symmetry < 70,
        feedback: '🔴 Spingi le ginocchia verso l\'esterno!'
      }
    ],
    
    scoring: { setup: { weight: 0.3 }, knees: { weight: 0.35 }, lockout: { weight: 0.35 } }
  },
  
  // ============== PRESS VARIATIONS ==============
  press: {
    name: 'Strict Press',
    icon: '🔥',
    category: 'upper',
    difficulty: 'intermediate',
    
    phases: {
      rack: {
        name: 'Rack Position',
        duration: [0, 0.15],
        angles: {
          leftElbow: { ideal: 45, tolerance: 15 },
          rightElbow: { ideal: 45, tolerance: 15 },
          trunk: { ideal: 0, tolerance: 5 }
        }
      },
      press: { name: 'Press', duration: [0.15, 0.7], angles: {} },
      lockout: {
        name: 'Lockout',
        duration: [0.7, 1.0],
        angles: {
          leftElbow: { ideal: 180, tolerance: 5 },
          rightElbow: { ideal: 180, tolerance: 5 },
          leftShoulder: { ideal: 180, tolerance: 10 },
          rightShoulder: { ideal: 180, tolerance: 10 }
        }
      }
    },
    
    faults: [
      {
        name: 'Excessive Layback',
        description: 'Eccessiva inclinazione indietro',
        severity: 'medium',
        check: (results) => results.angles.trunk < -15,
        feedback: '⚠️ Troppa inclinazione indietro. Core stretto!'
      },
      {
        name: 'Incomplete Lockout',
        description: 'Lockout incompleto',
        severity: 'low',
        check: (results) => {
          const avgElbow = (results.angles.leftElbow + results.angles.rightElbow) / 2;
          return avgElbow < 170;
        },
        feedback: '⚠️ Estendi completamente le braccia!'
      }
    ],
    
    scoring: { lockout: { weight: 0.35 }, stability: { weight: 0.25 }, symmetry: { weight: 0.25 }, tempo: { weight: 0.15 } }
  },
  
  pushPress: {
    name: 'Push Press',
    icon: '🔥',
    category: 'upper',
    difficulty: 'intermediate',
    
    phases: {
      rack: { name: 'Rack', duration: [0, 0.1], angles: { trunk: { ideal: 0, tolerance: 5 } } },
      dip: {
        name: 'Dip',
        duration: [0.1, 0.25],
        angles: {
          leftKnee: { ideal: 140, tolerance: 15 },
          rightKnee: { ideal: 140, tolerance: 15 }
        }
      },
      drive: { name: 'Drive', duration: [0.25, 0.5], angles: {} },
      lockout: {
        name: 'Lockout',
        duration: [0.5, 1.0],
        angles: {
          leftElbow: { ideal: 180, tolerance: 5 },
          rightElbow: { ideal: 180, tolerance: 5 }
        }
      }
    },
    
    faults: [
      {
        name: 'Shallow Dip',
        description: 'Dip troppo corto',
        severity: 'medium',
        check: (results) => {
          const avgKnee = (results.angles.leftKnee + results.angles.rightKnee) / 2;
          return avgKnee > 160;
        },
        feedback: '⚠️ Dip più profondo per più potenza!'
      }
    ],
    
    scoring: { dip: { weight: 0.25 }, drive: { weight: 0.25 }, lockout: { weight: 0.3 }, timing: { weight: 0.2 } }
  },
  
  benchPress: {
    name: 'Bench Press',
    icon: '💪',
    category: 'upper',
    difficulty: 'intermediate',
    
    phases: {
      start: {
        name: 'Arms Extended',
        duration: [0, 0.15],
        angles: {
          leftElbow: { ideal: 175, tolerance: 10 },
          rightElbow: { ideal: 175, tolerance: 10 }
        }
      },
      bottom: {
        name: 'Chest Touch',
        duration: [0.4, 0.6],
        angles: {
          leftElbow: { ideal: 90, tolerance: 15 },
          rightElbow: { ideal: 90, tolerance: 15 }
        }
      },
      lockout: {
        name: 'Lockout',
        duration: [0.85, 1.0],
        angles: {
          leftElbow: { ideal: 175, tolerance: 10 },
          rightElbow: { ideal: 175, tolerance: 10 }
        }
      }
    },
    
    faults: [
      {
        name: 'Elbow Flare',
        description: 'Gomiti troppo larghi',
        severity: 'medium',
        check: (results) => {
          const elbow = results.landmarks[LANDMARKS.LEFT_ELBOW];
          const shoulder = results.landmarks[LANDMARKS.LEFT_SHOULDER];
          return Math.abs(elbow.y - shoulder.y) < 0.02;
        },
        feedback: '⚠️ Gomiti a 45°, non a 90°!'
      },
      {
        name: 'Uneven Press',
        description: 'Spinta asimmetrica',
        severity: 'medium',
        check: (results) => results.symmetry < 80,
        feedback: '⚠️ Spingi in modo uniforme con entrambe le braccia!'
      }
    ],
    
    scoring: { rom: { weight: 0.3 }, symmetry: { weight: 0.35 }, elbowPath: { weight: 0.35 } }
  },
  
  // ============== PULL VARIATIONS ==============
  pullup: {
    name: 'Pull-up',
    icon: '🔥',
    category: 'upper',
    difficulty: 'intermediate',
    
    phases: {
      hang: {
        name: 'Dead Hang',
        duration: [0, 0.15],
        angles: {
          leftElbow: { ideal: 175, tolerance: 10 },
          rightElbow: { ideal: 175, tolerance: 10 }
        }
      },
      pull: { name: 'Pull', duration: [0.15, 0.65], angles: {} },
      top: {
        name: 'Chin Over Bar',
        duration: [0.65, 0.85],
        angles: {
          leftElbow: { ideal: 60, tolerance: 20 },
          rightElbow: { ideal: 60, tolerance: 20 }
        }
      },
      descent: { name: 'Controlled Descent', duration: [0.85, 1.0], angles: {} }
    },
    
    faults: [
      {
        name: 'Kipping',
        description: 'Movimento oscillatorio',
        severity: 'medium',
        check: (results) => results.velocity?.hip > 0.5,
        feedback: '⚠️ Niente slancio! Mantieni il controllo.'
      },
      {
        name: 'Partial ROM',
        description: 'Range of motion incompleto',
        severity: 'medium',
        check: (results) => {
          const avgElbow = (results.angles.leftElbow + results.angles.rightElbow) / 2;
          return avgElbow > 90;
        },
        feedback: '⚠️ Mento sopra la sbarra!'
      }
    ],
    
    scoring: { rom: { weight: 0.35 }, control: { weight: 0.3 }, symmetry: { weight: 0.2 }, stability: { weight: 0.15 } }
  },
  
  muscleUp: {
    name: 'Muscle-up',
    icon: '🔥',
    category: 'upper',
    difficulty: 'advanced',
    
    phases: {
      hang: { name: 'Hang', duration: [0, 0.1], angles: {} },
      pull: { name: 'High Pull', duration: [0.1, 0.4], angles: {} },
      transition: {
        name: 'Transition',
        duration: [0.4, 0.6],
        angles: {
          leftElbow: { ideal: 90, tolerance: 20 },
          rightElbow: { ideal: 90, tolerance: 20 }
        }
      },
      dip: {
        name: 'Dip Lockout',
        duration: [0.6, 1.0],
        angles: {
          leftElbow: { ideal: 175, tolerance: 10 },
          rightElbow: { ideal: 175, tolerance: 10 }
        }
      }
    },
    
    faults: [
      {
        name: 'Chicken Wing',
        description: 'Un braccio alla volta',
        severity: 'high',
        check: (results) => {
          const diff = Math.abs(results.angles.leftElbow - results.angles.rightElbow);
          return diff > 30;
        },
        feedback: '🔴 Entrambe le braccia insieme nella transizione!'
      }
    ],
    
    scoring: { pull: { weight: 0.3 }, transition: { weight: 0.4 }, lockout: { weight: 0.3 } }
  },
  
  row: {
    name: 'Bent Over Row',
    icon: '💪',
    category: 'upper',
    difficulty: 'intermediate',
    
    phases: {
      setup: {
        name: 'Hinged Position',
        duration: [0, 0.2],
        angles: {
          leftHip: { ideal: 100, tolerance: 15 },
          rightHip: { ideal: 100, tolerance: 15 },
          trunk: { ideal: 45, tolerance: 15 }
        }
      },
      pull: {
        name: 'Pull to Hip',
        duration: [0.4, 0.6],
        angles: {
          leftElbow: { ideal: 90, tolerance: 20 },
          rightElbow: { ideal: 90, tolerance: 20 }
        }
      }
    },
    
    faults: [
      {
        name: 'Standing Up',
        description: 'Busto che si alza',
        severity: 'medium',
        check: (results) => results.angles.trunk < 30,
        feedback: '⚠️ Mantieni la posizione! Non alzarti durante la tirata.'
      }
    ],
    
    scoring: { position: { weight: 0.35 }, pull: { weight: 0.35 }, symmetry: { weight: 0.3 } }
  },
  
  // ============== OLYMPIC LIFTS ==============
  clean: {
    name: 'Clean',
    icon: '🏆',
    category: 'olympic',
    difficulty: 'advanced',
    
    phases: {
      setup: {
        name: 'Start Position',
        duration: [0, 0.1],
        angles: {
          leftKnee: { ideal: 110, tolerance: 15 },
          rightKnee: { ideal: 110, tolerance: 15 },
          trunk: { ideal: 30, tolerance: 10 }
        }
      },
      firstPull: { name: 'First Pull', duration: [0.1, 0.3], angles: {} },
      secondPull: { name: 'Second Pull (Extension)', duration: [0.3, 0.45], angles: {} },
      turnover: { name: 'Turnover', duration: [0.45, 0.6], angles: {} },
      catch: {
        name: 'Front Rack Catch',
        duration: [0.6, 0.8],
        angles: {
          leftKnee: { ideal: 80, tolerance: 20 },
          rightKnee: { ideal: 80, tolerance: 20 },
          leftElbow: { ideal: 90, tolerance: 20 }
        }
      },
      stand: { name: 'Stand', duration: [0.8, 1.0], angles: {} }
    },
    
    faults: [
      {
        name: 'Early Arm Bend',
        description: 'Braccia che si piegano troppo presto',
        severity: 'high',
        check: (results) => {
          // Check during first pull
          const avgElbow = (results.angles.leftElbow + results.angles.rightElbow) / 2;
          const avgHip = (results.angles.leftHip + results.angles.rightHip) / 2;
          return avgElbow < 160 && avgHip < 150;
        },
        feedback: '🔴 Braccia dritte fino all\'estensione delle anche!'
      },
      {
        name: 'Jumping Forward',
        description: 'Salto in avanti',
        severity: 'medium',
        check: (results) => {
          const hip = results.landmarks[LANDMARKS.LEFT_HIP];
          return hip.x > 0.55; // Moved forward
        },
        feedback: '⚠️ Resta sopra il bilanciere! Non saltare in avanti.'
      }
    ],
    
    scoring: { positions: { weight: 0.3 }, speed: { weight: 0.25 }, catch: { weight: 0.25 }, stability: { weight: 0.2 } }
  },
  
  snatch: {
    name: 'Snatch',
    icon: '🏆',
    category: 'olympic',
    difficulty: 'expert',
    
    phases: {
      setup: {
        name: 'Start',
        duration: [0, 0.1],
        angles: {
          leftKnee: { ideal: 100, tolerance: 15 },
          rightKnee: { ideal: 100, tolerance: 15 }
        }
      },
      firstPull: { name: 'First Pull', duration: [0.1, 0.25], angles: {} },
      secondPull: { name: 'Second Pull', duration: [0.25, 0.4], angles: {} },
      turnover: { name: 'Turnover', duration: [0.4, 0.55], angles: {} },
      catch: {
        name: 'Overhead Catch',
        duration: [0.55, 0.75],
        angles: {
          leftKnee: { ideal: 70, tolerance: 20 },
          rightKnee: { ideal: 70, tolerance: 20 },
          leftElbow: { ideal: 180, tolerance: 10 },
          rightElbow: { ideal: 180, tolerance: 10 }
        }
      },
      stand: { name: 'Stand', duration: [0.75, 1.0], angles: {} }
    },
    
    faults: [
      {
        name: 'Press Out',
        description: 'Gomiti che si piegano in ricezione',
        severity: 'high',
        check: (results) => {
          const avgElbow = (results.angles.leftElbow + results.angles.rightElbow) / 2;
          return avgElbow < 160;
        },
        feedback: '🔴 Braccia bloccate in ricezione!'
      },
      {
        name: 'Bar Forward',
        description: 'Bilanciere in avanti',
        severity: 'high',
        check: (results) => {
          const wrist = results.landmarks[LANDMARKS.LEFT_WRIST];
          const shoulder = results.landmarks[LANDMARKS.LEFT_SHOULDER];
          return wrist.x > shoulder.x + 0.1;
        },
        feedback: '🔴 Bilanciere dietro la testa, non davanti!'
      }
    ],
    
    scoring: { positions: { weight: 0.25 }, speed: { weight: 0.2 }, catch: { weight: 0.35 }, stability: { weight: 0.2 } }
  },
  
  // ============== CORE ==============
  plank: {
    name: 'Plank',
    icon: '🧘',
    category: 'core',
    difficulty: 'beginner',
    
    phases: {
      hold: {
        name: 'Hold',
        duration: [0, 1.0],
        angles: {
          trunk: { ideal: 0, tolerance: 5 },
          leftHip: { ideal: 180, tolerance: 10 },
          rightHip: { ideal: 180, tolerance: 10 }
        }
      }
    },
    
    faults: [
      {
        name: 'Hip Sag',
        description: 'Anche che cedono',
        severity: 'high',
        check: (results) => {
          const avgHip = (results.angles.leftHip + results.angles.rightHip) / 2;
          return avgHip > 190;
        },
        feedback: '🔴 Anche che cedono! Contrai i glutei e il core.'
      },
      {
        name: 'Pike',
        description: 'Anche troppo alte',
        severity: 'medium',
        check: (results) => {
          const avgHip = (results.angles.leftHip + results.angles.rightHip) / 2;
          return avgHip < 165;
        },
        feedback: '⚠️ Anche troppo alte. Allinea spalle-anche-caviglie.'
      }
    ],
    
    scoring: { alignment: { weight: 0.4 }, stability: { weight: 0.35 }, duration: { weight: 0.25 } }
  },
  
  hollowBody: {
    name: 'Hollow Body',
    icon: '🧘',
    category: 'core',
    difficulty: 'intermediate',
    
    phases: {
      hold: {
        name: 'Hollow Hold',
        duration: [0, 1.0],
        angles: {
          leftHip: { ideal: 150, tolerance: 15 },
          rightHip: { ideal: 150, tolerance: 15 },
          leftShoulder: { ideal: 150, tolerance: 15 }
        }
      }
    },
    
    faults: [
      {
        name: 'Low Back Off Floor',
        description: 'Zona lombare staccata',
        severity: 'high',
        check: (results) => {
          const hip = results.landmarks[LANDMARKS.LEFT_HIP];
          const shoulder = results.landmarks[LANDMARKS.LEFT_SHOULDER];
          // If there's too much arch
          return Math.abs(hip.y - shoulder.y) > 0.15;
        },
        feedback: '🔴 Schiaccia la zona lombare a terra!'
      }
    ],
    
    scoring: { position: { weight: 0.5 }, stability: { weight: 0.3 }, duration: { weight: 0.2 } }
  },
  
  // ============== LUNGE VARIATIONS ==============
  lunge: {
    name: 'Walking Lunge',
    icon: '🚶',
    category: 'lower',
    difficulty: 'beginner',
    
    phases: {
      standing: { name: 'Standing', duration: [0, 0.15], angles: {} },
      bottom: {
        name: 'Lunge Position',
        duration: [0.4, 0.6],
        angles: {
          leftKnee: { ideal: 90, tolerance: 15 },
          rightKnee: { ideal: 90, tolerance: 15 },
          trunk: { ideal: 0, tolerance: 10 }
        }
      }
    },
    
    faults: [
      {
        name: 'Knee Over Toe',
        description: 'Ginocchio troppo avanti',
        severity: 'medium',
        check: (results) => {
          const knee = results.landmarks[LANDMARKS.LEFT_KNEE];
          const ankle = results.landmarks[LANDMARKS.LEFT_ANKLE];
          return knee.x > ankle.x + 0.05;
        },
        feedback: '⚠️ Ginocchio non oltre la punta del piede!'
      },
      {
        name: 'Torso Lean',
        description: 'Busto inclinato',
        severity: 'low',
        check: (results) => Math.abs(results.angles.trunk) > 15,
        feedback: '⚠️ Busto dritto!'
      }
    ],
    
    scoring: { depth: { weight: 0.35 }, stability: { weight: 0.35 }, trunk: { weight: 0.3 } }
  },
  
  bulgarianSplitSquat: {
    name: 'Bulgarian Split Squat',
    icon: '🚶',
    category: 'lower',
    difficulty: 'intermediate',
    
    phases: {
      top: {
        name: 'Standing',
        duration: [0, 0.2],
        angles: {
          leftKnee: { ideal: 170, tolerance: 15 }
        }
      },
      bottom: {
        name: 'Bottom',
        duration: [0.4, 0.6],
        angles: {
          leftKnee: { ideal: 90, tolerance: 15 },
          trunk: { ideal: 0, tolerance: 10 }
        }
      }
    },
    
    faults: [
      {
        name: 'Front Knee Collapse',
        description: 'Ginocchio anteriore che cede',
        severity: 'high',
        check: (results) => {
          const knee = results.landmarks[LANDMARKS.LEFT_KNEE];
          const ankle = results.landmarks[LANDMARKS.LEFT_ANKLE];
          return knee.x > ankle.x + 0.03;
        },
        feedback: '🔴 Ginocchio in linea con la caviglia!'
      }
    ],
    
    scoring: { depth: { weight: 0.35 }, stability: { weight: 0.4 }, symmetry: { weight: 0.25 } }
  },
  
  // ============== KETTLEBELL ==============
  kettlebellSwing: {
    name: 'Kettlebell Swing',
    icon: '🔔',
    category: 'power',
    difficulty: 'intermediate',
    
    phases: {
      hike: {
        name: 'Hike',
        duration: [0, 0.2],
        angles: {
          leftHip: { ideal: 80, tolerance: 15 },
          leftKnee: { ideal: 130, tolerance: 15 }
        }
      },
      extension: {
        name: 'Hip Extension',
        duration: [0.2, 0.5],
        angles: {
          leftHip: { ideal: 180, tolerance: 10 },
          leftKnee: { ideal: 175, tolerance: 10 }
        }
      },
      top: {
        name: 'Float',
        duration: [0.5, 0.65],
        angles: {
          leftShoulder: { ideal: 90, tolerance: 20 } // Arms parallel to ground
        }
      }
    },
    
    faults: [
      {
        name: 'Squatting',
        description: 'Troppo squat, poco hip hinge',
        severity: 'medium',
        check: (results) => {
          const avgKnee = (results.angles.leftKnee + results.angles.rightKnee) / 2;
          return avgKnee < 110;
        },
        feedback: '⚠️ È un hip hinge, non uno squat! Meno ginocchia, più anche.'
      },
      {
        name: 'Arms Pulling',
        description: 'Braccia che tirano',
        severity: 'medium',
        check: (results) => {
          const avgElbow = (results.angles.leftElbow + results.angles.rightElbow) / 2;
          return avgElbow < 160;
        },
        feedback: '⚠️ Le braccia sono corde! La potenza viene dalle anche.'
      }
    ],
    
    scoring: { hipHinge: { weight: 0.4 }, power: { weight: 0.3 }, float: { weight: 0.3 } }
  },
  
  turkishGetUp: {
    name: 'Turkish Get-Up',
    icon: '🔔',
    category: 'functional',
    difficulty: 'advanced',
    
    phases: {
      lying: { name: 'Start', duration: [0, 0.1], angles: {} },
      toElbow: { name: 'To Elbow', duration: [0.1, 0.2], angles: {} },
      toHand: { name: 'To Hand', duration: [0.2, 0.3], angles: {} },
      highBridge: { name: 'High Bridge', duration: [0.3, 0.4], angles: {} },
      sweep: { name: 'Leg Sweep', duration: [0.4, 0.5], angles: {} },
      halfKneel: {
        name: 'Half Kneel',
        duration: [0.5, 0.7],
        angles: {
          leftElbow: { ideal: 180, tolerance: 10 } // Arm locked
        }
      },
      stand: {
        name: 'Stand',
        duration: [0.7, 1.0],
        angles: {
          leftElbow: { ideal: 180, tolerance: 10 }
        }
      }
    },
    
    faults: [
      {
        name: 'Bent Arm',
        description: 'Braccio piegato',
        severity: 'high',
        check: (results) => {
          const avgElbow = (results.angles.leftElbow + results.angles.rightElbow) / 2;
          return avgElbow < 160;
        },
        feedback: '🔴 Braccio bloccato per tutta la durata!'
      },
      {
        name: 'Lost Eye Contact',
        description: 'Sguardo non sul peso',
        severity: 'low',
        check: (results) => {
          const nose = results.landmarks[LANDMARKS.NOSE];
          const wrist = results.landmarks[LANDMARKS.LEFT_WRIST];
          return Math.abs(nose.x - wrist.x) > 0.2;
        },
        feedback: '⚠️ Occhi sempre sul kettlebell!'
      }
    ],
    
    scoring: { armLock: { weight: 0.4 }, control: { weight: 0.35 }, stability: { weight: 0.25 } }
  },
  
  // ============== GYMNASTIC ==============
  handstand: {
    name: 'Handstand Hold',
    icon: '🤸',
    category: 'gymnastic',
    difficulty: 'advanced',
    
    phases: {
      hold: {
        name: 'Hold',
        duration: [0, 1.0],
        angles: {
          leftElbow: { ideal: 180, tolerance: 5 },
          rightElbow: { ideal: 180, tolerance: 5 },
          leftShoulder: { ideal: 180, tolerance: 10 }
        }
      }
    },
    
    faults: [
      {
        name: 'Banana Back',
        description: 'Schiena arcuata',
        severity: 'medium',
        check: (results) => {
          const shoulder = results.landmarks[LANDMARKS.LEFT_SHOULDER];
          const hip = results.landmarks[LANDMARKS.LEFT_HIP];
          const ankle = results.landmarks[LANDMARKS.LEFT_ANKLE];
          // Check alignment
          return Math.abs(shoulder.x - hip.x) > 0.05 || Math.abs(hip.x - ankle.x) > 0.05;
        },
        feedback: '⚠️ Corpo in linea! Contrai core e glutei.'
      },
      {
        name: 'Bent Arms',
        description: 'Braccia piegate',
        severity: 'high',
        check: (results) => {
          const avgElbow = (results.angles.leftElbow + results.angles.rightElbow) / 2;
          return avgElbow < 170;
        },
        feedback: '🔴 Braccia dritte! Spingi il pavimento.'
      }
    ],
    
    scoring: { alignment: { weight: 0.4 }, arms: { weight: 0.3 }, stability: { weight: 0.3 } }
  },
  
  pistolSquat: {
    name: 'Pistol Squat',
    icon: '🤸',
    category: 'gymnastic',
    difficulty: 'advanced',
    
    phases: {
      standing: {
        name: 'One Leg Stand',
        duration: [0, 0.2],
        angles: {
          leftKnee: { ideal: 175, tolerance: 10 }
        }
      },
      bottom: {
        name: 'Bottom',
        duration: [0.4, 0.6],
        angles: {
          leftKnee: { ideal: 45, tolerance: 15 },
          leftHip: { ideal: 45, tolerance: 15 }
        }
      }
    },
    
    faults: [
      {
        name: 'Heel Lift',
        description: 'Tallone che si alza',
        severity: 'medium',
        check: (results) => {
          const heel = results.landmarks[LANDMARKS.LEFT_HEEL];
          const toe = results.landmarks[LANDMARKS.LEFT_FOOT_INDEX];
          return heel.y < toe.y - 0.02;
        },
        feedback: '⚠️ Tallone a terra! Lavora sulla mobilità caviglia.'
      }
    ],
    
    scoring: { depth: { weight: 0.35 }, balance: { weight: 0.4 }, control: { weight: 0.25 } }
  }
};

/**
 * Get movement by name
 */
export function getMovement(name) {
  return MOVEMENTS[name.toLowerCase()] || MOVEMENTS[name] || null;
}

/**
 * Get all movements
 */
export function getAllMovements() {
  return Object.entries(MOVEMENTS).map(([key, value]) => ({
    id: key,
    ...value
  }));
}

/**
 * Get movements by category
 */
export function getMovementsByCategory(category) {
  return Object.entries(MOVEMENTS)
    .filter(([_, m]) => m.category === category)
    .map(([key, value]) => ({ id: key, ...value }));
}

/**
 * Get movements by difficulty
 */
export function getMovementsByDifficulty(difficulty) {
  return Object.entries(MOVEMENTS)
    .filter(([_, m]) => m.difficulty === difficulty)
    .map(([key, value]) => ({ id: key, ...value }));
}

/**
 * Get all categories
 */
export function getCategories() {
  const cats = new Set();
  Object.values(MOVEMENTS).forEach(m => cats.add(m.category));
  return Array.from(cats);
}

/**
 * Detect current phase of movement based on angles
 */
export function detectPhase(movementId, results) {
  const movement = getMovement(movementId);
  if (!movement || !results.angles) return null;
  
  let bestMatch = null;
  let bestScore = -1;
  
  for (const [phaseName, phase] of Object.entries(movement.phases)) {
    if (!phase.angles || Object.keys(phase.angles).length === 0) continue;
    
    let phaseScore = 0;
    let angleCount = 0;
    
    for (const [angleName, target] of Object.entries(phase.angles)) {
      const actual = results.angles[angleName];
      if (actual !== undefined) {
        const diff = Math.abs(actual - target.ideal);
        const score = Math.max(0, 100 - (diff / target.tolerance) * 50);
        phaseScore += score;
        angleCount++;
      }
    }
    
    if (angleCount > 0) {
      const avgScore = phaseScore / angleCount;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestMatch = { name: phaseName, ...phase, matchScore: avgScore };
      }
    }
  }
  
  return bestMatch;
}

/**
 * Check for faults in current pose
 */
export function checkFaults(movementId, results, history = []) {
  const movement = getMovement(movementId);
  if (!movement || !movement.faults) return [];
  
  const detectedFaults = [];
  
  for (const fault of movement.faults) {
    try {
      if (fault.check(results, history)) {
        detectedFaults.push({
          name: fault.name,
          description: fault.description,
          severity: fault.severity,
          feedback: fault.feedback
        });
      }
    } catch (e) {
      // Fault check failed, skip
    }
  }
  
  return detectedFaults;
}

export default MOVEMENTS;
