// Il controller traduce la richiesta HTTP in input validi per il servizio.
// La logica di rete e il formato dei dati restano nel service dedicato.
const openLibrary = require('../services/openLibraryService');
const httpError = require('../utils/httpError');

// GET /api/books/search?title=...&author=...&isbn=...&page=1&limit=10
async function search(req, res) {
  // I query parameter arrivano come stringhe o possono mancare del tutto.
  // trim evita ricerche con spazi accidentali; l'ISBN viene normalizzato
  // rimuovendo trattini e spazi prima della validazione e della chiamata API.
  const title = req.query.title ? String(req.query.title).trim() : '';
  const author = req.query.author ? String(req.query.author).trim() : '';
  const isbn = req.query.isbn ? String(req.query.isbn).replace(/[-\s]/g, '') : '';

  // Almeno un criterio deve essere presente per evitare ricerche troppo ampie.
  if (!title && !author && !isbn) {
    throw httpError(400, 'Specifica almeno un parametro tra title, author e isbn');
  }
  // Un ISBN puo essere ISBN-10 (l'ultima cifra puo essere X) o ISBN-13.
  if (isbn && !/^(\d{9}[\dXx]|\d{13})$/.test(isbn)) {
    throw httpError(400, 'ISBN non valido: servono 10 o 13 cifre');
  }

  // La paginazione viene convertita da stringa a numero e controllata prima
  // di contattare l'API esterna. Il limite massimo protegge il servizio e l'API.
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  if (!Number.isInteger(page) || page < 1) {
    throw httpError(400, 'Il parametro page deve essere un intero maggiore di 0');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw httpError(400, 'Il parametro limit deve essere un intero tra 1 e 50');
  }

  // Express 5 inoltra automaticamente al gestore errori le rejection async.
  const result = await openLibrary.searchBooks({ title, author, isbn, page, limit });
  res.json(result);
}

// Un Work ID Open Library ha la forma OL seguito da cifre e dalla lettera W.
const OLID_REGEX = /^OL\d+W$/;

// GET /api/books/:olid
async function details(req, res) {
  const { olid } = req.params;
  // Validare l'ID prima della query evita input malformati e URL non attesi.
  if (!OLID_REGEX.test(olid)) {
    throw httpError(400, 'Identificativo Open Library non valido (es. OL27448W)');
  }

  // null significa che Open Library non ha trovato un'opera con questo ID.
  const book = await openLibrary.getBookDetails(olid);
  if (!book) {
    throw httpError(404, 'Libro non trovato');
  }
  res.json({ book });
}

// OLID_REGEX e condivisa col controller della libreria per validare il salvataggio.
module.exports = { search, details, OLID_REGEX };
