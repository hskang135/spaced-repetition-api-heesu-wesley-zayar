const express = require('express')
const LanguageService = require('./language-service')
const { requireAuth } = require('../middleware/jwt-auth')
const jsonBodyParser = express.json()
const LinkedList = require('../util/linkedListClass');

const languageRouter = express.Router()

languageRouter
  .use(requireAuth)
  .use(async (req, res, next) => {
    try {
      const language = await LanguageService.getUsersLanguage(
        req.app.get('db'),
        req.user.id,
      )

      if (!language)
        return res.status(404).json({
          error: `You don't have any languages`,
        })

      req.language = language
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .get('/', async (req, res, next) => {
    try {
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id,
      )
      res.json({
        language: req.language,
        words,
      })
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .get('/head', async (req, res, next) => {
    try {
      const response = await LanguageService.getWordAtHead(
        req.app.get('db'),
        req.user.id,
      )
      res.status(200)
      res.json(response)
    } catch (error) {
      console.log('caught error')
      next(error)
    }
  })

languageRouter
  .post('/guess', jsonBodyParser, async (req, res, next) => {
    if (!req.body.guess) {
      res.status(400).json({ error: `Missing 'guess' in request body` }).end()
    }
    else if (req.body.guess && req.body.word_id) {
      try {
        const wordToCheck = await LanguageService.getWordById(
          req.app.get('db'),
          req.body.word_id,
        )
        // Actions to take on a correct guess
        if (wordToCheck.translation === req.body.guess.toLowerCase()) {
          const correctTotalScore = await LanguageService.updateTotalScoreCorrect(
            req.app.get('db'),
            req.language.id
          )
          const getTotalScore = await LanguageService.getTotalScoreById(
            req.app.get('db'),
            req.user.id
          )
          let totalScore = getTotalScore.total_score;
          // This function also handles the memoryValue doubling.
          const correctCountIncrease = await LanguageService.updateCorrectCount(
            req.app.get('db'),
            req.body.word_id
          )
          const getCorrectCount = await LanguageService.getCorrectCountById(
            req.app.get('db'),
            req.body.word_id
          )
          let correctCount = getCorrectCount.correct_count;
          let incorrectCount = getCorrectCount.incorrect_count;
          let output = {
            'totalScore': totalScore,
            'correctCount': correctCount,
            'incorrectCount': incorrectCount
          }
          res.status(200)
          res.json(output)
        }
        else if (wordToCheck.translation !== req.body.guess.toLowerCase()) {
          const inCorrectTotalScore = await LanguageService.updateTotalScoreIncorrect(
            req.app.get('db'),
            req.user.id
          )
          const inCorrectCountIncrease = await LanguageService.updateIncorrectCount(
            req.app.get('db'),
            req.body.word_id
          )
          
          res.status(200)
          res.json({ message: 'this is Incorrect' })
        }
      } catch (error) {
        next(error)
      }

    }
  })

module.exports = languageRouter
