/**
 * Text & Field Validation Utilities for CarePlus Clinic
 * Detects invalid inputs, formatting errors, and gibberish / spam strings.
 */

/**
 * Checks if a string contains gibberish, keyboard smashing, or unreadable spam.
 * Examples caught: "vyugyutbgufuirbgcuitbgyucbvygubigf", "aaaaaaa", "asdfasdfasdf"
 * @param {string} text - Input text
 * @returns {boolean} true if gibberish is detected
 */
export const isGibberish = (text) => {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;

  // 1. Any single continuous "word" without spaces that is unusually long (>= 20 chars)
  const words = trimmed.split(/\s+/);
  for (const word of words) {
    if (word.length >= 20) {
      return true;
    }
  }

  // 2. Character repetition (e.g. "aaaaa", "11111")
  if (/(.)\1{4,}/i.test(trimmed)) {
    return true;
  }

  // 3. Repeated consonant clusters without vowels (e.g. "bcdfghjklmn")
  if (/[^aeiouyAEIOUY\s\d.,!?'"\-()]{6,}/i.test(trimmed)) {
    return true;
  }

  // 4. For strings >= 15 alphabetical characters, check vowel-to-letter ratio
  const alphaOnly = trimmed.replace(/[^a-zA-Z]/g, "");
  if (alphaOnly.length >= 15) {
    const vowels = alphaOnly.match(/[aeiouyAEIOUY]/g) || [];
    const vowelRatio = vowels.length / alphaOnly.length;
    // Normal English/Latin sentences have a vowel ratio between 25% and 55%
    if (vowelRatio < 0.15 || vowelRatio > 0.85) {
      return true;
    }
  }

  return false;
};

/**
 * Validates doctor or user full name.
 * @param {string} name
 * @returns {string} Error message or empty string if valid
 */
export const validateFullName = (name) => {
  if (!name || !name.trim()) {
    return "Full name is required.";
  }
  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return "Full name must be at least 3 characters long.";
  }
  if (!/^[a-zA-Z\s.'\-]+$/.test(trimmed)) {
    return "Name can only contain letters, spaces, hyphens, and dots.";
  }
  if (isGibberish(trimmed)) {
    return "Please enter a valid, recognizable full name.";
  }
  return "";
};

/**
 * Validates email address format.
 * @param {string} email
 * @returns {string} Error message or empty string if valid
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return "Email address is required.";
  }
  const trimmed = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return "Please enter a valid email address (e.g., doctor@careplus.clinic).";
  }
  return "";
};

/**
 * Validates phone numbers.
 * @param {string} phone
 * @param {boolean} [required=false]
 * @returns {string} Error message or empty string if valid
 */
export const validatePhone = (phone, required = false) => {
  if (!phone || !phone.trim()) {
    return required ? "Phone number is required." : "";
  }
  const trimmed = phone.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return "Phone number must contain between 7 and 15 digits.";
  }
  if (!/^[+\d\s\-()]+$/.test(trimmed)) {
    return "Phone number contains invalid characters.";
  }
  return "";
};

/**
 * Validates professional biography or medical summary.
 * @param {string} bio
 * @param {boolean} [required=false]
 * @returns {string} Error message or empty string if valid
 */
export const validateBiography = (bio, required = false) => {
  if (!bio || !bio.trim()) {
    return required ? "Biography and medical summary is required." : "";
  }
  const trimmed = bio.trim();
  if (isGibberish(trimmed)) {
    return "Invalid biography text. Please enter a meaningful description without random keyboard characters.";
  }
  if (trimmed.length < 15) {
    return "Biography is too short. Please provide at least 15 characters explaining the doctor's focus.";
  }
  return "";
};

/**
 * Validates qualification/degrees.
 * @param {string} qualification
 * @returns {string} Error message or empty string if valid
 */
export const validateQualification = (qualification) => {
  if (!qualification || !qualification.trim()) return "";
  const trimmed = qualification.trim();
  if (isGibberish(trimmed)) {
    return "Please enter valid medical qualifications (e.g. MBBS, MD, FRCS).";
  }
  return "";
};

/**
 * Validates medical license number.
 * @param {string} license
 * @returns {string} Error message or empty string if valid
 */
export const validateLicenseNumber = (license) => {
  if (!license || !license.trim()) return "";
  const trimmed = license.trim();
  if (isGibberish(trimmed)) {
    return "Please enter a valid medical license number.";
  }
  return "";
};
