/* eslint-disable class-methods-use-this */
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

  // Derive icon and dataCategory from categoryName
  getCategoryMetadata(categoryName) {
    const nameLower = categoryName.toLowerCase();

    // Map category names to icons and data-category values
    if (nameLower.includes('food') || nameLower.includes('drink')) {
      return { icon: 'food.svg', dataCategory: 'food-drinks' };
    }
    if (nameLower.includes('music')) {
      return { icon: 'music-player.svg', dataCategory: 'music' };
    }
    if (nameLower.includes('sport')) {
      return { icon: 'sports.svg', dataCategory: 'sports' };
    }
    if (nameLower.includes('movie') || nameLower.includes('tv')) {
      return { icon: 'popcorn.svg', dataCategory: 'movies-tv' };
    }

    // Default fallback
    return { icon: 'food.svg', dataCategory: 'food-drinks' };
  }

  // Fetch categories from JSON file
  async fetchCategories() {
    try {
      const response = await fetch('/game-questions.json');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      this.processCategories(data.data);
      return this.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Process categories data and group questions
  processCategories(data) {
    const categoryMap = {};
    const darkCategoryMap = {};
    const clueMap = {}; // Group clues by clueId

    // Store all clue data for who-is-in-the-dark
    this.allCluesData = data.filter((item) => item.gameType === GAME_TYPES.WHO_IS_IN_THE_DARK);

    // Group by categoryId and filter by gameType
    data.forEach((item) => {
      // Handle category-game type
      if (item.gameType === GAME_TYPES.CATEGORY_GAME) {
        if (!categoryMap[item.categoryId]) {
          categoryMap[item.categoryId] = {
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            questions: [],
          };
        }

        // Add question to category
        categoryMap[item.categoryId].questions.push({
          order: parseInt(item.questionOrder, 10),
          text: item.questionText,
          answersFormat: item.answersFormat || null,
        });
      }

      if (item.gameType === GAME_TYPES.WHO_IS_IN_THE_DARK) {
        if (!darkCategoryMap[item.categoryId]) {
          darkCategoryMap[item.categoryId] = {
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            questions: [],
          };
        }

        // Add question to dark category
        darkCategoryMap[item.categoryId].questions.push({
          order: parseInt(item.questionOrder, 10),
          text: item.questionText,
          answersFormat: item.answersFormat || null,
        });

        // Group clues by clueId (each clueId represents a unique clue)
        if (item.clueId) {
          if (!clueMap[item.clueId]) {
            clueMap[item.clueId] = {
              clueId: item.clueId,
              clueText: item.clueText,
              clueImage: item.clueImage,
              categoryId: item.categoryId,
              categoryName: item.categoryName,
              questions: [],
            };
          }

          // Add question to clue
          clueMap[item.clueId].questions.push({
            order: parseInt(item.questionOrder, 10),
            text: item.questionText,
            answersFormat: item.answersFormat || null,
          });
        }
      }
    });

    // Sort questions by order and convert to array for category-game
    this.categories = Object.values(categoryMap).map((category) => {
      category.questions.sort((a, b) => a.order - b.order);
      return category;
    });

    // Store questions by categoryId for easy access
    this.categories.forEach((category) => {
      this.categoryQuestions[category.categoryId] = category.questions;
    });

    // Sort questions by order and convert to array for who-is-in-the-dark
    this.darkCategories = Object.values(darkCategoryMap).map((category) => {
      category.questions.sort((a, b) => a.order - b.order);
      return category;
    });

    // Store dark questions by categoryId for easy access
    this.darkCategories.forEach((category) => {
      this.darkCategoryQuestions[category.categoryId] = category.questions;
    });

    // Group clues by categoryId
    Object.values(clueMap).forEach((clue) => {
      clue.questions.sort((a, b) => a.order - b.order);
      if (!this.darkClues[clue.categoryId]) {
        this.darkClues[clue.categoryId] = [];
      }
      this.darkClues[clue.categoryId].push(clue);
    });
  }

  // Get category icon path
  getCategoryIcon(categoryId) {
    const category = this.getCategory(categoryId);
    if (!category) return './icons/food.svg';

    const metadata = this.getCategoryMetadata(category.categoryName);
    return `./icons/${metadata.icon}`;
  }

  // Get data-category attribute value
  getDataCategory(categoryId) {
    const category = this.getCategory(categoryId);
    if (!category) return categoryId;

    const metadata = this.getCategoryMetadata(category.categoryName);
    return metadata.dataCategory;
  }

  // Get questions for a category
  getCategoryQuestions(categoryId) {
    if (!categoryId) {
      return [];
    }
    // Check if it's a dark category
    if (categoryId.startsWith('dark_')) {
      return this.darkCategoryQuestions[categoryId] || [];
    }
    return this.categoryQuestions[categoryId] || [];
  }

  // Get answersFormat for question 2 of a category or clue
  getAnswersFormat(categoryId, selectedClue = null) {
    if (!categoryId) {
      return null;
    }

    let questions;

    // For who-is-in-the-dark, use selected clue's questions if available
    const isDarkGame = categoryId.startsWith('dark_');
    if (isDarkGame && selectedClue && selectedClue.questions) {
      questions = selectedClue.questions;
    } else {
      questions = this.getCategoryQuestions(categoryId);
    }

    // Find question 2 and return its answersFormat
    const question2 = questions.find((q) => q.order === 2);
    return question2?.answersFormat || null;
  }

  // Get category by categoryId
  getCategory(categoryId) {
    if (!categoryId) {
      return null;
    }
    if (categoryId.startsWith('dark_')) {
      return this.darkCategories.find((cat) => cat.categoryId === categoryId);
    }
    return this.categories.find((cat) => cat.categoryId === categoryId);
  }

  // Render categories in the UI
  renderCategories() {
    const categoriesContainer = document.querySelector('.categories-cards');
    if (!categoriesContainer) return;

    // Determine which categories to render based on game type
    const categoriesToRender = this.gameEngine.gameType === 'who-is-in-the-dark'
      ? this.darkCategories
      : this.categories;

    // Only render if we have categories (fetch was successful)
    if (categoriesToRender.length === 0) {
      console.warn('No categories available to render');
      return;
    }

    categoriesContainer.innerHTML = '';

    categoriesToRender.forEach((category) => {
      const categoryCard = document.createElement('div');
      categoryCard.className = 'category-card';
      categoryCard.dataset.category = this.getDataCategory(category.categoryId);
      categoryCard.dataset.categoryId = category.categoryId;

      const iconPath = this.getCategoryIcon(category.categoryId);

      categoryCard.innerHTML = `
        <div class="icon">
          <img src="${iconPath}" alt="${category.categoryName}" />
        </div>
        <p class="text">${category.categoryName}</p>
      `;

      categoriesContainer.appendChild(categoryCard);
    });
  }

  // Update question sections with category questions
  updateQuestionSections(categoryId, selectedClue = null) {
    if (!categoryId) {
      console.warn('updateQuestionSections: No categoryId provided');
      return;
    }

    const category = this.getCategory(categoryId);
    if (!category) {
      console.warn(`updateQuestionSections: Category not found for categoryId: ${categoryId}`);
      console.log('Available categories:', this.categories.map((c) => c.categoryId));
      console.log('Available dark categories:', this.darkCategories.map((c) => c.categoryId));
      return;
    }

    // For who-is-in-the-dark, use selected clue's questions if available
    let questions;
    const isDarkGame = categoryId.startsWith('dark_');

    if (isDarkGame && selectedClue && selectedClue.questions) {
      questions = selectedClue.questions;
    } else {
      questions = this.getCategoryQuestions(categoryId);
    }

    if (questions.length === 0) {
      console.warn(`updateQuestionSections: No questions found for categoryId: ${categoryId}`);
      return;
    }

    if (isDarkGame) {
      // Update dark-question-1
      const darkQuestion1Section = document.querySelector('#dark-question-1');
      if (darkQuestion1Section && questions[0]) {
        const questionText1 = darkQuestion1Section.querySelector('.question-text');
        const categoryIcon = darkQuestion1Section.querySelector(
          '.question-category .container img',
        );
        const categoryName = darkQuestion1Section.querySelector(
          '.question-category .container span',
        );

        if (questionText1) {
          questionText1.textContent = questions[0].text;
        }
        if (categoryIcon) {
          categoryIcon.src = this.getCategoryIcon(categoryId);
          categoryIcon.alt = category.categoryName;
        }
        if (categoryName) {
          categoryName.textContent = category.categoryName;
        }
      }

      // Update dark-question-2
      const darkQuestion2Section = document.querySelector('#dark-question-2');
      if (darkQuestion2Section && questions[1]) {
        const questionText2 = darkQuestion2Section.querySelector('.question-text');
        const categoryIcon2 = darkQuestion2Section.querySelector(
          '.question-category .container img',
        );
        const categoryName2 = darkQuestion2Section.querySelector(
          '.question-category .container span',
        );

        if (questionText2) {
          questionText2.textContent = questions[1].text;
        }
        if (categoryIcon2) {
          categoryIcon2.src = this.getCategoryIcon(categoryId);
          categoryIcon2.alt = category.categoryName;
        }
        if (categoryName2) {
          categoryName2.textContent = category.categoryName;
        }
      }
    } else {
      // Update category-question-1
      const question1Section = document.querySelector('#category-question-1');
      if (question1Section && questions[0]) {
        const questionText1 = question1Section.querySelector('.question-text');
        const categoryIcon = question1Section.querySelector(
          '.question-category .container img',
        );
        const categoryName = question1Section.querySelector(
          '.question-category .container span',
        );

        if (questionText1) {
          questionText1.textContent = questions[0].text;
        }
        if (categoryIcon) {
          categoryIcon.src = this.getCategoryIcon(categoryId);
          categoryIcon.alt = category.categoryName;
        }
        if (categoryName) {
          categoryName.textContent = category.categoryName;
        }
      }

      // Update category-question-2
      const question2Section = document.querySelector('#category-question-2');
      if (question2Section && questions[1]) {
        const questionText2 = question2Section.querySelector('.question-text');
        const categoryIcon2 = question2Section.querySelector(
          '.question-category .container img',
        );
        const categoryName2 = question2Section.querySelector(
          '.question-category .container span',
        );

        if (questionText2) {
          questionText2.textContent = questions[1].text;
        }
        if (categoryIcon2) {
          categoryIcon2.src = this.getCategoryIcon(categoryId);
          categoryIcon2.alt = category.categoryName;
        }
        if (categoryName2) {
          categoryName2.textContent = category.categoryName;
        }
      }
    }

    // Update player-answers section category (used by both game types)
    const playerAnswersSection = document.querySelector('#player-answers');
    if (playerAnswersSection) {
      const categoryIcon = playerAnswersSection.querySelector(
        '.question-category .container img',
      );
      const categoryName = playerAnswersSection.querySelector(
        '.question-category .container span',
      );

      if (categoryIcon) {
        categoryIcon.src = this.getCategoryIcon(categoryId);
        categoryIcon.alt = category.categoryName;
      }
      if (categoryName) {
        categoryName.textContent = category.categoryName;
      }
    }
  }

  // Get clues for a category
  getCluesForCategory(categoryId) {
    return this.darkClues[categoryId] || [];
  }

  // Randomly select a clue from a category
  selectRandomClue(categoryId) {
    const clues = this.getCluesForCategory(categoryId);
    if (clues.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * clues.length);
    return clues[randomIndex];
  }
}
