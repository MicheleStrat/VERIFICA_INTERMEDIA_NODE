// Servizio di persistenza per il catalogo Book, indipendente dalle richieste HTTP.
const Book = require('../models/Book');
const openLibrary = require('./openLibraryService');
const httpError = require('../utils/httpError');

/**
 * Cerca un'opera nel catalogo locale e, se assente, la recupera da Open Library.
 * @param {string} openLibraryId Identificativo Work dell'opera da trovare.
 * @returns {Promise<import('../models/Book')>} Documento Book esistente o appena creato.
 * @throws {Error} Errore HTTP 404 se l'opera non esiste nel catalogo remoto.
 */
async function findOrCreateBook(openLibraryId) {
  // La prima query evita chiamate ripetute a Open Library per opere gia note.
  const existing = await Book.findOne({ openLibraryId });
  if (existing) return existing;

  // Una risposta null indica che l'ID e formalmente corretto ma non esiste nel catalogo remoto.
  const details = await openLibrary.getBookDetails(openLibraryId);
  if (!details) {
    throw httpError(404, 'Libro non trovato su Open Library');
  }
  // details ha gia il formato definito dal nostro schema grazie alla normalizzazione.
  return Book.create(details);
}

// Espone al controller la funzione di recupero o creazione del libro.
module.exports = { findOrCreateBook };
