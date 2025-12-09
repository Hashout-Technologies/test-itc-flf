// /**
//  * Game Configuration Constants
//  * Central configuration for all game settings, sections, and constants
//  */
export const GAME_SECTIONS = {
  'game-room-creation': 'game-room-creation',
  'game-room-joining': 'game-room-joining',
  'game-room-details': 'game-room-details',
  'choose-game-category': 'choose-game-category',
  'clue-is-ready': 'clue-is-ready',
  'youre-in-the-dark': 'youre-in-the-dark',
  'category-question-1': 'category-question-1',
  'category-question-2': 'category-question-2',
  'dark-question-1': 'dark-question-1',
  'dark-question-2': 'dark-question-2',
  'player-answers': 'player-answers',
  'who-is-in-the-dark': 'who-is-in-the-dark',
  'clue-answers': 'clue-answers',
  'reveal-answer': 'reveal-answer',
  winner: 'winner',
  leaderboard: 'leaderboard',
};

// Single timer duration for all sections (in seconds)
export const TIMER_DURATION = 30;

export const DEFAULT_QUESTIONS = [
  {
    title: "What is Pankaj's favorite food?",
    answers: ['Gulab Jamun', 'Chicken Biryani', 'Chole Bhature', 'Pav Bhaji'],
  },
  {
    title: "What is Rajat's favorite drink?",
    answers: ['Coffee', 'Tea', 'Orange Juice', 'Water'],
  },
  {
    title: "What is Minakshi's favorite dessert?",
    answers: ['Ice Cream', 'Cake', 'Cookies', 'Fruit'],
  },
];

export const USERNAME_ADJECTIVES = [
  'Cool', 'Swift', 'Bright', 'Bold', 'Clever', 'Quick', 'Brave', 'Wise',
  'Calm', 'Eager', 'Fierce', 'Gentle', 'Happy', 'Jolly', 'Kind', 'Lucky',
  'Mighty', 'Noble', 'Proud', 'Rapid', 'Silent', 'Tough', 'Vivid', 'Wild',
];

export const USERNAME_NOUNS = [
  'Tiger', 'Eagle', 'Wolf', 'Lion', 'Falcon', 'Bear', 'Shark', 'Hawk',
  'Fox', 'Panther', 'Dragon', 'Phoenix', 'Raven', 'Cobra', 'Jaguar', 'Leopard',
  'Stallion', 'Rhino', 'Bison', 'Moose', 'Elk', 'Stag', 'Ram', 'Bull',
];

export const GAME_TYPES = {
  CATEGORY_GAME: 'category-game',
  WHO_IS_IN_THE_DARK: 'who-is-in-the-dark',
};

export const DEFAULT_TOTAL_QUESTIONS = 3;
