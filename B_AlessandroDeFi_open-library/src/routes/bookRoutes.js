// Definisce gli URL dei libri e li collega ai rispettivi handler.
const express = require('express');
const bookController = require('../controllers/bookController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Richiede un token Bearer valido per tutti gli endpoint di questo router.
router.use(requireAuth);

// La rotta specifica /search precede quella parametrica /:olid.
router.get('/search', bookController.search);
router.get('/:olid', bookController.details);

// Esporta il router da montare nell'applicazione Express.
module.exports = router;
