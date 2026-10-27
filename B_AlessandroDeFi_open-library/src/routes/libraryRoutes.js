// Definisce gli URL per consultare e modificare la libreria personale.
const express = require('express');
const libraryController = require('../controllers/libraryController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Autentica ogni richiesta e aggiunge l'utente verificato a req.user.
router.use(requireAuth);

// Crea una voce, elenca le voci oppure legge o rimuove una voce specifica.
router.post('/', libraryController.save);
router.get('/', libraryController.list);
router.get('/:id', libraryController.getOne);
router.delete('/:id', libraryController.remove);

// Esporta il router da montare nell'applicazione Express.
module.exports = router;
