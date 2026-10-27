// Controller degli endpoint della libreria personale.
const mongoose = require('mongoose');
const UserBook = require('../models/UserBook');
const Shelf = require('../models/Shelf');
const STATUSES = require('../config/statuses');
const { findOrCreateBook } = require('../services/bookService');
const { getDefaultShelf } = require('../services/shelfService');
const { findUserBook } = require('../services/libraryService');
const { OLID_REGEX } = require('./bookController');
const httpError = require('../utils/httpError');

/**
 * POST /api/library
 * Aggiunge un libro alla libreria dell'utente autenticato.
 */
async function save(req, res) {
  // Se non specificato, il libro viene salvato nello stato "da leggere".
  const { openLibraryId, status = 'da_leggere', shelfId } = req.body || {};
  const userId = req.user._id;

  if (!OLID_REGEX.test(String(openLibraryId || ''))) {
    throw httpError(400, 'openLibraryId obbligatorio e valido (es. OL27448W)');
  }
  if (!STATUSES.includes(status)) {
    throw httpError(400, `Stato non valido: usa ${STATUSES.join(', ')}`);
  }

  // Verifica lo scaffale richiesto o recupera quello predefinito.
  let shelf;
  if (shelfId) {
    if (!mongoose.isValidObjectId(shelfId)) throw httpError(400, 'shelfId non valido');
    shelf = await Shelf.findOne({ _id: shelfId, user: userId });
    if (!shelf) throw httpError(404, 'Scaffale non trovato');
  } else {
    shelf = await getDefaultShelf(userId, status);
  }

  // Gli scaffali predefiniti determinano lo stato del libro.
  const finalStatus = shelf.isDefault ? shelf.status : status;

  const book = await findOrCreateBook(openLibraryId);
  // Evita di aggiungere due volte lo stesso libro alla libreria dell'utente.
  if (await UserBook.exists({ user: userId, book: book._id })) {
    throw httpError(409, 'Libro gia presente nella tua libreria');
  }

  const userBook = await UserBook.create({
    user: userId,
    book: book._id,
    shelf: shelf._id,
    status: finalStatus,
  });
  await userBook.populate(['book', 'shelf']);
  res.status(201).json({ userBook });
}

/**
 * GET /api/library
 * Restituisce i libri dell'utente, con filtri facoltativi per stato e scaffale.
 */
async function list(req, res) {
  // Limita i risultati alla libreria dell'utente autenticato.
  const filter = { user: req.user._id };

  if (req.query.status) {
    if (!STATUSES.includes(req.query.status)) {
      throw httpError(400, `Stato non valido: usa ${STATUSES.join(', ')}`);
    }
    filter.status = req.query.status;
  }
  if (req.query.shelf) {
    if (!mongoose.isValidObjectId(req.query.shelf)) throw httpError(400, 'Id scaffale non valido');
    filter.shelf = req.query.shelf;
  }

  // Include i dati collegati e ordina dal più recente.
  const userBooks = await UserBook.find(filter).populate(['book', 'shelf']).sort({ updatedAt: -1 });
  res.json({ count: userBooks.length, userBooks });
}

/**
 * GET /api/library/:id
 * Restituisce un libro salvato nella libreria dell'utente.
 */
async function getOne(req, res) {
  const userBook = await findUserBook(req.user._id, req.params.id);
  res.json({ userBook });
}

/**
 * DELETE /api/library/:id
 * Rimuove un libro dalla libreria dell'utente.
 */
async function remove(req, res) {
  // Rimuove la relazione personale e mantiene il libro nel catalogo condiviso.
  const userBook = await findUserBook(req.user._id, req.params.id);
  await userBook.deleteOne();
  res.status(204).end();
}

module.exports = { save, list, getOne, remove };
