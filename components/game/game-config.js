/**
 * Game Configuration Constants
 * Central configuration for all game settings, sections, and constants
 */
/* eslint-disable */
export const GAME_SECTIONS = {
  GAMES_SELECTOR: 'games-selector',
  GAME_INSTRUCTIONS: 'game-instructions',
  GAME_ROOM_CREATION: 'game-room-creation',
  GAME_ROOM_JOINING: 'game-room-joining',
  GAME_ROOM_DETAILS: 'game-room-details',
  CHOOSE_CATEGORY: 'choose-game-category',
  CLUE_READY: 'clue-is-ready',
  YOURE_IN_DARK: 'youre-in-the-dark',
  CATEGORY_QUESTION_1: 'category-question-1',
  CATEGORY_QUESTION_2: 'category-question-2',
  DARK_QUESTION_1: 'dark-question-1',
  DARK_QUESTION_2: 'dark-question-2',
  PLAYER_ANSWERS: 'player-answers',
  WHO_IS_IN_DARK: 'who-is-in-the-dark',
  CLUE_ANSWERS: 'clue-answers',
  REVEAL_ANSWER: 'reveal-answer',
  WINNER: 'winner',
  LEADERBOARD: 'leaderboard'
};

export const GAME_TYPES = {
  CATEGORY_GAME: 'category-game',
  WHO_IS_IN_THE_DARK: 'who-is-in-the-dark'
};

export const GAMES = [
  { id: 1, name: 'Category Game', type: GAME_TYPES.CATEGORY_GAME },
  { id: 2, name: 'Who is in the Dark', type: GAME_TYPES.WHO_IS_IN_THE_DARK }
];

// Timer configurations (in seconds)
export const TIMER_DURATION = 60;
export const QUESTION_TIMER_DURATION = 30;

// Default socket configuration
export const SOCKET_CONFIG = {
  url: 'http://localhost:3000',
  options: {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling']
  }
};

// Username generation
export const USERNAME_ADJECTIVES = [
  'Cool', 'Swift', 'Bright', 'Bold', 'Clever', 'Quick', 'Brave', 'Wise',
  'Calm', 'Eager', 'Fierce', 'Gentle', 'Happy', 'Jolly', 'Kind', 'Lucky',
  'Mighty', 'Noble', 'Proud', 'Rapid', 'Silent', 'Tough', 'Vivid', 'Wild'
];

export const USERNAME_NOUNS = [
  'Tiger', 'Eagle', 'Wolf', 'Lion', 'Falcon', 'Bear', 'Shark', 'Hawk',
  'Fox', 'Panther', 'Dragon', 'Phoenix', 'Raven', 'Cobra', 'Jaguar', 'Leopard',
  'Stallion', 'Rhino', 'Bison', 'Moose', 'Elk', 'Stag', 'Ram', 'Bull'
];

// Mock questions for demo
export const DEFAULT_QUESTIONS = [
  {
    title: "What is your favorite food?",
    answers: ['Gulab Jamun', 'Chicken Biryani', 'Chole Bhature', 'Pav Bhaji']
  },
  {
    title: "What is your favorite drink?",
    answers: ['Coffee', 'Tea', 'Orange Juice', 'Water']
  },
  {
    title: "What is your favorite dessert?",
    answers: ['Ice Cream', 'Cake', 'Cookies', 'Fruit']
  }
];

export const DEFAULT_TOTAL_QUESTIONS = 3;

// Room code configuration
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Input constraints
export const MAX_ANSWER_LENGTH = 30;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;
