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

export function shareOnWhatsApp(roomCode, gameType) {
  const currentUrl = window.location.origin + window.location.pathname;
  const joinUrl = new URL(currentUrl);
  joinUrl.searchParams.set('room', roomCode);
  if (gameType) {
    joinUrl.searchParams.set('game', gameType);
  }

  const gameTypeName = gameType === 'who-is-in-the-dark'
    ? 'Who is in the Dark'
    : gameType === 'category-game'
      ? 'Category Game'
      : 'Game';

  const message = `Join my ${gameTypeName} room!\n\nRoom Code: ${roomCode}\n\nClick to join directly:\n${joinUrl.toString()}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

export function formatNumber(num) {
  return num.toString().padStart(2, '0');
}
