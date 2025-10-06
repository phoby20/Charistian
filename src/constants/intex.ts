export const constants = {
  KEYS: [
    "C",
    "C#",
    "Db",
    "D",
    "D#",
    "Eb",
    "E",
    "Fb",
    "F",
    "F#",
    "Gb",
    "G",
    "G#",
    "Ab",
    "A",
    "A#",
    "Bb",
    "B",
    "Cb",
  ],
  TONES: ["Major", "Minor"],
  TIME_SIGNATURES: [
    "2/2", // Cut time (Alla breve)
    "2/4", // March or polka
    "3/2", // Renaissance or baroque music
    "3/4", // Waltz or minuet
    "4/2", // Early music
    "4/4", // Common time
    "6/4", // Early music or compound duple
    "6/8", // Compound duple (e.g., jigs)
    "12/8", // Compound quadruple
  ],
  LIMITS: {
    FREE: {
      maxUsers: 10,
      weeklySetlists: 2,
      monthlySetlists: 8,
      maxScores: 50,
    },
    SMART: {
      maxUsers: 150,
      weeklySetlists: 100,
      monthlySetlists: 100,
      maxScores: 800,
    },
    ENTERPRISE: {
      maxUsers: Infinity,
      weeklySetlists: Infinity,
      monthlySetlists: Infinity,
      maxScores: Infinity,
    },
  },
} as const;
