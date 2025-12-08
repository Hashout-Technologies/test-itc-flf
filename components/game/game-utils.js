/**
 * Game Utility Functions
 * Shared utility functions for the game block
 */
/* eslint-disable */
import { 
  USERNAME_ADJECTIVES, 
  USERNAME_NOUNS, 
  ROOM_CODE_LENGTH, 
  ROOM_CODE_CHARS 
} from './game-config.js';

/**
 * Generate a random username
 */
export function generateRandomUsername() {
  const randomAdjective = USERNAME_ADJECTIVES[
    Math.floor(Math.random() * USERNAME_ADJECTIVES.length)
  ];
  const randomNoun = USERNAME_NOUNS[
    Math.floor(Math.random() * USERNAME_NOUNS.length)
  ];
  const randomNumber = Math.floor(Math.random() * 1000);

  return `${randomAdjective}${randomNoun}${randomNumber}`;
}

/**
 * Generate a random room code
 */
export function generateRoomCode() {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS.charAt(
      Math.floor(Math.random() * ROOM_CODE_CHARS.length)
    );
  }
  return code;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Share room code on WhatsApp
 */
export function shareOnWhatsApp(roomCode) {
  const message = `Join my game room! Use code: ${roomCode}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

/**
 * Format number with leading zeros
 */
export function formatNumber(num) {
  return num.toString().padStart(2, '0');
}

/**
 * Validate room code format
 */
export function isValidRoomCode(code) {
  if (!code || typeof code !== 'string') return false;
  if (code.length !== ROOM_CODE_LENGTH) return false;
  return /^[A-Z0-9]+$/.test(code);
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input) {
  if (!input) return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 100); // Limit length
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get first name from full name
 */
export function getFirstName(fullName) {
  if (!fullName) return '';
  return fullName.split(' ')[0];
}

/**
 * Shuffle array
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get stored user data from localStorage
 */
export function getStoredUserData() {
  try {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading user data:', error);
    return null;
  }
}

/**
 * Store user data in localStorage
 */
export function storeUserData(userData) {
  try {
    localStorage.setItem('userData', JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
}
