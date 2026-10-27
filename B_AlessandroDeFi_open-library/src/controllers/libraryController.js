// Questo controller collega il catalogo condiviso dei Book con la relazione
// personale UserBook. Le dipendenze Shelf/status sono fornite dal componente
// scaffali condiviso del progetto.
const mongoose = require('mongoose');
const UserBook = require('../models/UserBook');
const Shelf = require('../models/Shelf');
const STATUSES = require('../config/statuses');
const { findOrCreateBook } = require('../services/bookService');
const { getDefaultShelf } = require('../services/shelfService');
const { findUserBook } = require('../services/libraryService');
const { OLID_REGEX } = require('./bookController');
const httpError = require('../utils/httpError');

// POST /api/library  body: { openLibraryId, status?, shelfId? }
async function save(req, res) {
  // Lo stato predefinito inserisce il libro nella lista "da leggere".
  // req.user e valorizzato dal middleware JWT montato sulla rotta.
  const { openLibraryId, status = 'da_leggere', shelfId } = req.body || {};
  const userId = req.user._id;

  // L'ID deve identificare un'opera Open Library (Work), non una stampa/edizione.
  if (!OLID_REGEX.test(String(openLibraryId || ''))) {
    throw httpError(400, 'openLibraryId obbligatorio e valido (es. OL27448W)');
  }
  if (!STATUSES.includes(status)) {
    throw httpError(400, `Stato non valido: usa ${STATUSES.join(', ')}`);
  }

  // Scaffale: quello indicato dall'utente oppure quello di default per lo stato
  // Se e indicato uno scaffale, verifichiamo sia il formato dell'ID sia
  // la proprieta: l'utente non puo salvare libri negli scaffali altrui.
  let shelf;
  if (shelfId) {
    if (!mongoose.isValidObjectId(shelfId)) throw httpError(400, 'shelfId non valido');
    shelf = await Shelf.findOne({ _id: shelfId, user: userId });
    if (!shelf) throw httpError(404, 'Scaffale non trovato');
  } else {
    shelf = await getDefaultShelf(userId, status);
  }

  // Negli scaffali di default lo stato coincide con quello dello scaffale
  // Negli scaffali standard lo stato e determinato dallo scaffale stesso.
  // Negli scaffali personalizzati si mantiene invece lo stato richiesto.
  const finalStatus = shelf.isDefault ? shelf.status : status;

  // Il Book viene riusato se esiste gia; altrimenti viene scaricato e creato.
  const book = await findOrCreateBook(openLibraryId);
  // UserBook e univoco per coppia utente/libro; restituiamo 409 in modo chiaro
  // prima di tentare l'inserimento che sarebbe comunque bloccato dall'indice.
  if (await UserBook.exists({ user: userId, book: book._id })) {
    throw httpError(409, 'Libro gia presente nella tua libreria');
  }

  // Salviamo la relazione personale, non una copia completa dei dati del libro.
  const userBook = await UserBook.create({
    user: userId,
    book: book._id,
    shelf: shelf._id,
    status: finalStatus,
  });
  // Popoliamo i riferimenti per restituire al client titolo e scaffale leggibili.
  await userBook.populate(['book', 'shelf']);
  res.status(201).json({ userBook });
}

// GET /api/library?status=in_lettura&shelf=<id>
async function list(req, res) {
  // Ogni query parte sempre dall'utente autenticato: l'elenco e privato.
  const filter = { user: req.user._id };

  // I filtri sono facoltativi; se forniti, vanno controllati prima di interrogare MongoDB.
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

  // populate sostituisce gli ID con i dati dei documenti Book e Shelf;
  // l'ordinamento mostra per primi i libri modificati piu di recente.
  const userBooks = await UserBook.find(filter).populate(['book', 'shelf']).sort({ updatedAt: -1 });
  res.json({ count: userBooks.length, userBooks });
}

// GET /api/library/:id
async function getOne(req, res) {
  // La ricerca include l'ID dell'utente, quindi un libro altrui risulta inesistente.
  const userBook = await findUserBook(req.user._id, req.params.id);
  res.json({ userBook });
}

// DELETE /api/library/:id
async function remove(req, res) {
  // Riutilizziamo la ricerca protetta, poi eliminiamo solo la relazione personale.
  // Il documento Book rimane nel catalogo perche potrebbe essere usato da altri.
  const userBook = await findUserBook(req.user._id, req.params.id);
  await userBook.deleteOne();
  res.status(204).end();
}

module.exports = { save, list, getOne, remove };
