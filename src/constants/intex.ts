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
    "3/8", // Slow compound triple
    "4/2", // Early music
    "4/4", // Common time
    "5/4", // Modern or jazz
    "5/8", // Asymmetric meter
    "6/4", // Early music or compound duple
    "6/8", // Compound duple (e.g., jigs)
    "7/4", // Progressive rock or modern
    "7/8", // Balkan or progressive music
    "9/8", // Compound triple
    "12/8", // Compound quadruple
  ],
} as const;
