// /**
//  * Game Utility Functions
//  * Shared utility functions for the game block
//  */

import { USERNAME_ADJECTIVES, USERNAME_NOUNS } from './game-config.js';

// This will be removed when i have implemented authutication
export function generateRandomUsername() {
  const randomAdjective = USERNAME_ADJECTIVES[Math
    .floor(Math.random() * USERNAME_ADJECTIVES.length)];
  const randomNoun = USERNAME_NOUNS[Math.floor(Math.random() * USERNAME_NOUNS.length)];
  const randomNumber = Math.floor(Math.random() * 1000);

  return `${randomAdjective}${randomNoun}${randomNumber}`;
}
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

export function shareOnWhatsApp(roomCode) {
  const message = `Join my game room! Use code: ${roomCode}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

export function formatNumber(num) {
  return num.toString().padStart(2, '0');
}
