/**
 * Game Category Manager
 * Handles category data, questions, and clues
 */
/* eslint-disable */
import { GAME_TYPES } from './game-config.js';

export class GameCategoryManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.categories = [];
    this.categoryQuestions = {};
    this.darkCategories = [];
    this.darkCategoryQuestions = {};
    this.darkClues = {};
    this.allCluesData = [];
  }

  /**
   * Fetch categories from API
   */
  async fetchCategories() {
    try {
      const response = await fetch('/asset/categories.json');
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      this.processCategories(data.data);
      return this.categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }

  /**
   * Process categories data
   */
  processCategories(data) {
    const categoryMap = {};
    const darkCategoryMap = {};

    data.forEach(item => {
      if (item.gameType === GAME_TYPES.CATEGORY_GAME) {
        if (!categoryMap[item.categoryId]) {
          categoryMap[item.categoryId] = {
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            icon: item.icon,
            iconSelected: item.iconSelected,
            questions: []
          };
        }
        categoryMap[item.categoryId].questions.push({
          order: parseInt(item.questionOrder),
          text: item.questionText,
          answersFormat: item.answersFormat || null
        });
      } else if (item.gameType === GAME_TYPES.WHO_IS_IN_THE_DARK) {
        if (!darkCategoryMap[item.categoryId]) {
          darkCategoryMap[item.categoryId] = {
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            icon: item.icon,
            iconSelected: item.iconSelected,
            questions: []
          };
        }
        darkCategoryMap[item.categoryId].questions.push({
          order: parseInt(item.questionOrder),
          text: item.questionText,
          answersFormat: item.answersFormat || null
        });
      }
    });

    this.categories = Object.values(categoryMap).map(cat => {
      cat.questions.sort((a, b) => a.order - b.order);
      return cat;
    });

    this.darkCategories = Object.values(darkCategoryMap).map(cat => {
      cat.questions.sort((a, b) => a.order - b.order);
      return cat;
    });

    this.categories.forEach(cat => {
      this.categoryQuestions[cat.categoryId] = cat.questions;
    });

    this.darkCategories.forEach(cat => {
      this.darkCategoryQuestions[cat.categoryId] = cat.questions;
    });
  }

  /**
   * Render categories in UI
   */
  renderCategories() {
    const container = this.gameEngine.block.querySelector('.categories-cards');
    if (!container) return;

    const categoriesToRender = this.gameEngine.gameType === GAME_TYPES.WHO_IS_IN_THE_DARK
      ? this.darkCategories
      : this.categories;

    container.innerHTML = categoriesToRender.map(category => {
      return `
        <div class="category-card" 
             data-category="${category.id || category.categoryId}" 
             data-category-id="${category.categoryId || category.id}">
          <div class="icon">
            <img src="${category.icon}" 
                 alt="${category.name}"
                 data-original-src="${category.icon}"
                 data-selected-src="${category.iconSelected}" />
          </div>
          <p class="text">${category.name || category.categoryName}</p>
        </div>
      `;
    }).join('');
  }

  /**
   * Update question sections with category questions
   */
  updateQuestionSections(categoryId, selectedClue = null) {
    if (!categoryId) return;

    const category = this.getCategory(categoryId);
    if (!category) {
      console.warn('Category not found:', categoryId);
      return;
    }

    const questions = this.getCategoryQuestions(categoryId);
    if (questions.length === 0) return;

    const isDarkGame = this.gameEngine.gameType === GAME_TYPES.WHO_IS_IN_THE_DARK;
    const sectionPrefix = isDarkGame ? 'dark' : 'category';

    // Update question 1
    this.updateQuestionSection(`${sectionPrefix}-question-1`, questions[0], category);

    // Update question 2
    if (questions[1]) {
      this.updateQuestionSection(`${sectionPrefix}-question-2`, questions[1], category);
    }
  }

  /**
   * Update individual question section
   */
  updateQuestionSection(sectionId, question, category) {
    const section = this.gameEngine.block.querySelector(`#${sectionId}`);
    if (!section) return;

    const questionText = section.querySelector('.question-text');
    const categoryName = section.querySelector('.question-category .container span');

    if (questionText) {
      questionText.textContent = question.text;
    }

    if (categoryName) {
      categoryName.textContent = category.categoryName;
    }
  }

  /**
   * Get category questions
   */
  getCategoryQuestions(categoryId) {
    if (categoryId.startsWith('dark_')) {
      return this.darkCategoryQuestions[categoryId] || [];
    }
    return this.categoryQuestions[categoryId] || [];
  }

  /**
   * Get category by ID
   */
  getCategory(categoryId) {
    if (categoryId.startsWith('dark_')) {
      return this.darkCategories.find(cat => cat.categoryId === categoryId);
    }
    return this.categories.find(cat => cat.categoryId === categoryId);
  }

  /**
   * Select random clue for "Who is in the Dark"
   */
  selectRandomClue(categoryId) {
    const clues = this.darkClues[categoryId] || [];
    if (clues.length === 0) {
      return { clueText: 'CUPCAKE', clueImage: null, questions: [] };
    }
    const randomIndex = Math.floor(Math.random() * clues.length);
    return clues[randomIndex];
  }

  /**
   * Get answers format for question 2
   */
  getAnswersFormat(categoryId, selectedClue = null) {
    const questions = this.getCategoryQuestions(categoryId);
    const question2 = questions.find(q => q.order === 2);
    return question2?.answersFormat || null;
  }
}
