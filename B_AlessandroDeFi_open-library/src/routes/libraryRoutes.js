// Questa router raggruppa gli endpoint relativi alla libreria personale.
const express = require('express');
const libraryController = require('../controllers/libraryController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Tutte le operazioni sono private: req.user viene aggiunto dal middleware JWT.
router.use(requireAuth);

// POST crea il legame utente-libro; GET elenca o legge un elemento;
// DELETE rimuove il legame senza cancellare il libro dal catalogo condiviso.
router.post('/', libraryController.save);
router.get('/', libraryController.list);
router.get('/:id', libraryController.getOne);
router.delete('/:id', libraryController.remove);

module.exports = router;
