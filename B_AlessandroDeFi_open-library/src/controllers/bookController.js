// Controller degli endpoint di ricerca e dettaglio dei libri Open Library.
const openLibrary = require('../services/openLibraryService');
const httpError = require('../utils/httpError');

/**
 * GET /api/books/search
 * Cerca libri per titolo, autore o ISBN con paginazione facoltativa.
 */
async function search(req, res) {
  // Normalizza i parametri ricevuti dalla query string.
  const title = req.query.title ? String(req.query.title).trim() : '';
  const author = req.query.author ? String(req.query.author).trim() : '';
  const isbn = req.query.isbn ? String(req.query.isbn).replace(/[-\s]/g, '') : '';

  if (!title && !author && !isbn) {
    throw httpError(400, 'Specifica almeno un parametro tra title, author e isbn');
  }
  // Sono ammessi ISBN-10 e ISBN-13.
  if (isbn && !/^(\d{9}[\dXx]|\d{13})$/.test(isbn)) {
    throw httpError(400, 'ISBN non valido: servono 10 o 13 cifre');
  }
  // Valida la paginazione prima della richiesta al servizio esterno.
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  if (!Number.isInteger(page) || page < 1) {
    throw httpError(400, 'Il parametro page deve essere un intero maggiore di 0');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw httpError(400, 'Il parametro limit deve essere un intero tra 1 e 50');
  }

  const result = await openLibrary.searchBooks({ title, author, isbn, page, limit });
  res.json(result);
}

// Formato degli identificativi Work di Open Library.
const OLID_REGEX = /^OL\d+W$/;

/**
 * GET /api/books/:olid
 * Restituisce il dettaglio di un'opera Open Library.
 */
async function details(req, res) {
  const { olid } = req.params;
  if (!OLID_REGEX.test(olid)) {
    throw httpError(400, 'Identificativo Open Library non valido (es. OL27448W)');
  }

  const book = await openLibrary.getBookDetails(olid);
  if (!book) {
    throw httpError(404, 'Libro non trovato');
  }
  res.json({ book });
}

// L'espressione regolare è condivisa con il controller della libreria.
module.exports = { search, details, OLID_REGEX };
