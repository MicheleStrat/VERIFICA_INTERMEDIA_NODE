// Servizio di persistenza per il catalogo Book, indipendente dalle richieste HTTP.
const Book = require('../models/Book');
const openLibrary = require('./openLibraryService');
const httpError = require('../utils/httpError');

// Restituisce il libro dal database; se manca, recupera i dettagli remoti e li salva.
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

// Il controller della libreria usa questa funzione per salvare un'opera.
module.exports = { findOrCreateBook };
