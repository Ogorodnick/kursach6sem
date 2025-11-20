const { Deck, Card, UserCardProgress } = require('../models');
const csv = require('csv-parser'); // Нужно установить: npm install csv-parser
const stream = require('stream');

const deckController = {
  // Создание колоды
  async createDeck(req, res) {
    try {
      const { title, description, is_public = false, tags = [] } = req.body;
      
      const deck = await Deck.create({
        title,
        description,
        is_public,
        user_id: req.user.id
      });

      res.status(201).json({
        message: 'Deck created successfully',
        deck
      });
    } catch (error) {
      console.error('Create deck error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Получение колод пользователя
  async getUserDecks(req, res) {
    try {
      const decks = await Deck.findByUser(req.user.id);
      res.json({ decks });
    } catch (error) {
      console.error('Get user decks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Получение публичных колод
  async getPublicDecks(req, res) {
    try {
      const { page = 1, limit = 20, search = '' } = req.query;
      const offset = (page - 1) * limit;
      
      console.log('Поиск публичных колод с параметрами:', { page, limit, search, offset });
      
      const decks = await Deck.findPublicDecks(parseInt(limit), offset, search);
      res.json({ decks });
    } catch (error) {
      console.error('Get public decks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Получение конкретной колоды
  async getDeck(req, res) {
    try {
      const { id } = req.params;
      const deck = await Deck.findById(id);
      
      if (!deck) {
        return res.status(404).json({ error: 'Deck not found' });
      }

      // Проверяем доступ
      if (!deck.is_public && deck.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Получаем карточки колоды
      const cards = await Card.findByDeck(id);

      res.json({
        deck: {
          ...deck,
          cards
        }
      });
    } catch (error) {
      console.error('Get deck error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Обновление колоды
  async updateDeck(req, res) {
    try {
      const { id } = req.params;
      const { title, description, is_public } = req.body;

      // Проверяем владение
      const deck = await Deck.findById(id);
      if (!deck || deck.user_id !== req.user.id) {
        return res.status(404).json({ error: 'Deck not found' });
      }

      const updatedDeck = await Deck.update(id, { title, description, is_public });
      
      res.json({
        message: 'Deck updated successfully',
        deck: updatedDeck
      });
    } catch (error) {
      console.error('Update deck error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Удаление колоды
  async deleteDeck(req, res) {
    try {
      const { id } = req.params;

      // Проверяем владение
      const deck = await Deck.findById(id);
      if (!deck || deck.user_id !== req.user.id) {
        return res.status(404).json({ error: 'Deck not found' });
      }

      await Deck.delete(id);
      
      res.json({ message: 'Deck deleted successfully' });
    } catch (error) {
      console.error('Delete deck error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Копирование колоды
  async copyDeck(req, res) {
    try {
      const { id } = req.params;

      // Проверяем, существует ли колода и публичная ли она
      const originalDeck = await Deck.findById(id);
      if (!originalDeck) {
        return res.status(404).json({ error: 'Deck not found' });
      }

      if (!originalDeck.is_public && originalDeck.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const newDeck = await Deck.copyForUser(id, req.user.id);
      
      res.status(201).json({
        message: 'Deck copied successfully',
        deck: newDeck
      });
    } catch (error) {
      console.error('Copy deck error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

// deckController.js - улучшенная версия метода importCardsFromCSV
  async importCardsFromCSV(req, res) {
    try {
      const { id } = req.params;
      
      console.log('Начало импорта CSV для колоды:', id);
      console.log('Файлы в запросе:', req.files);

      // Проверяем владение колодой
      const deck = await Deck.findById(id);
      if (!deck) {
        return res.status(404).json({ error: 'Deck not found' });
      }
      
      if (deck.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied - you are not the owner of this deck' });
      }

      if (!req.files || !req.files.csv) {
        return res.status(400).json({ error: 'CSV file is required' });
      }

      const csvFile = req.files.csv;
      console.log('CSV файл получен:', {
        name: csvFile.name,
        size: csvFile.size,
        mimetype: csvFile.mimetype
      });

      const cards = [];
      const errors = [];

      // Парсим CSV файл
      const parseCSV = () => {
        return new Promise((resolve, reject) => {
          const bufferStream = new stream.PassThrough();
          bufferStream.end(csvFile.data);

          let rowCount = 0;

          bufferStream
            .pipe(csv({ 
              headers: ['question', 'answer'],
              skipEmptyLines: true,
              mapHeaders: ({ header, index }) => {
                // Гибкая обработка заголовков
                const cleanHeader = header ? header.trim().toLowerCase() : '';
                if (index === 0 && (!cleanHeader || cleanHeader === 'question')) return 'question';
                if (index === 1 && (!cleanHeader || cleanHeader === 'answer')) return 'answer';
                return cleanHeader;
              },
              mapValues: ({ value }) => value ? value.trim() : ''
            }))
            .on('data', (row) => {
              rowCount++;
              console.log(`Строка ${rowCount}:`, row);

              // Проверяем обязательные поля
              if (!row.question && !row.answer) {
                errors.push(`Строка ${rowCount}: пропущены question и answer`);
                return;
              }

              if (!row.question) {
                errors.push(`Строка ${rowCount}: пропущен question`);
                return;
              }

              if (!row.answer) {
                errors.push(`Строка ${rowCount}: пропущен answer`);
                return;
              }

              cards.push({
                deck_id: parseInt(id),
                question: row.question,
                answer: row.answer,
                question_type: 'text',
                answer_type: 'text'
              });
            })
            .on('end', () => {
              console.log(`CSV parsing complete: ${rowCount} строк обработано, ${cards.length} карточек создано`);
              resolve();
            })
            .on('error', (error) => {
              console.error('CSV parsing error:', error);
              reject(error);
            });
        });
      };

      await parseCSV();

      if (cards.length === 0) {
        return res.status(400).json({ 
          error: 'No valid cards found in CSV file',
          details: errors.length > 0 ? errors : ['CSV файл не содержит валидных данных']
        });
      }

      // Создаем карточки в базе данных
      const createdCards = [];
      for (const cardData of cards) {
        try {
          const card = await Card.create(cardData);
          createdCards.push(card);
        } catch (error) {
          errors.push(`Ошибка создания карточки: "${cardData.question}" - ${error.message}`);
        }
      }

      if (createdCards.length === 0) {
        return res.status(400).json({ 
          error: 'Failed to create any cards',
          details: errors 
        });
      }

      res.json({
        message: `Successfully imported ${createdCards.length} cards`,
        importedCount: createdCards.length,
        cards: createdCards,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('CSV import error:', error);
      res.status(500).json({ 
        error: 'Internal server error during CSV import',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

};

module.exports = deckController;