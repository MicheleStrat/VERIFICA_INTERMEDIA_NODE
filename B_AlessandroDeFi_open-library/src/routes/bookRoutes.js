// Le rotte definiscono gli URL; i controller contengono la logica applicativa.
const express = require('express');
const bookController = require('../controllers/bookController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Protegge sia la ricerca sia il dettaglio: il middleware verifica il Bearer JWT.
router.use(requireAuth);

// L'ordine e rilevante: /search va definita prima di /:olid per evitare che
// la parola "search" venga interpretata come identificativo di un'opera.
router.get('/search', bookController.search);
router.get('/:olid', bookController.details);

module.exports = router;
