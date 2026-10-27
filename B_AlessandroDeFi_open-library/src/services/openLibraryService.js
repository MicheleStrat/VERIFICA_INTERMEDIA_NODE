// Questo modulo isola tutte le chiamate HTTP al servizio esterno.
// Controller e model non devono conoscere URL o formato originale di Open Library.
const httpError = require('../utils/httpError');

const BASE_URL = 'https://openlibrary.org';
const COVERS_URL = 'https://covers.openlibrary.org/b/id';

// Campi richiesti all'API di ricerca: richiediamo solo cio che BookTrack usa.
// La richiesta mirata riduce la dimensione della risposta e rende esplicito
// quali dati Open Library e tenuta a restituire per ogni risultato.
const FIELDS = [
  'key',
  'title',
  'author_name',
  'first_publish_year',
  'number_of_pages_median',
  'cover_i',
  'subject',
].join(',');

// Esegue una richiesta GET e converte la risposta HTTP in un oggetto JavaScript.
// La rete puo fallire (timeout, DNS, connessione) oppure Open Library puo
// rispondere con uno status di errore: in entrambi i casi il client di BookTrack
// riceve 502, che indica un problema del servizio a monte.
async function getJson(url) {
  let response;
  try {
    response = await fetch(url, { headers: { 'User-Agent': 'BookTrack (progetto didattico)' } });
  } catch {
    throw httpError(502, 'Open Library non raggiungibile');
  }
  if (!response.ok) {
    throw httpError(502, `Errore da Open Library (${response.status})`);
  }
  // La risposta e JSON secondo il contratto dell'endpoint /search.json.
  // Eventuali errori di parsing vengono lasciati al gestore errori comune.
  return response.json();
}

// Converte i nomi e i valori del documento Open Library nello schema interno.
// In questo modo il resto dell'app non dipende dal formato specifico dell'API.
function normalizeBook(doc) {
  return {
    // L'API restituisce una chiave di percorso; nel database conserviamo solo l'ID.
    openLibraryId: doc.key.replace('/works/', ''), // es. "/works/OL27448W" -> "OL27448W"
    title: doc.title,
    authors: doc.author_name || [],
    firstPublishYear: doc.first_publish_year || null,
    numberOfPages: doc.number_of_pages_median || null,
    // Manteniamo al massimo dieci generi per contenere dimensione e rumore dei dati.
    subjects: (doc.subject || []).slice(0, 10),
    coverUrl: doc.cover_i ? `${COVERS_URL}/${doc.cover_i}-M.jpg` : null,
  };
}

// Ricerca remota. La validazione dei parametri utente si fa nel controller;
// questo servizio si occupa di tradurli in query string e interpretare i risultati.
async function searchBooks({ title, author, isbn, page = 1, limit = 10 }) {
  const params = new URLSearchParams({ fields: FIELDS, page: String(page), limit: String(limit) });
  if (title) params.set('title', title);
  if (author) params.set('author', author);
  if (isbn) params.set('isbn', isbn);

  const data = await getJson(`${BASE_URL}/search.json?${params}`);
  return {
    // Open Library ha usato sia numFound sia num_found in risposte diverse.
    total: data.numFound ?? data.num_found ?? 0,
    page: Number(page),
    results: (data.docs || []).map(normalizeBook),
  };
}

// Recupera un singolo libro tramite l'ID dell'opera (es. "OL27448W").
// L'endpoint di ricerca filtrato per key restituisce anche autori, pagine e
// copertina, cosi il salvataggio puo usare lo stesso formato normalizzato.
async function getBookDetails(openLibraryId) {
  const params = new URLSearchParams({ q: `key:/works/${openLibraryId}`, fields: FIELDS, limit: '1' });
  const data = await getJson(`${BASE_URL}/search.json?${params}`);
  const doc = (data.docs || [])[0];
  return doc ? normalizeBook(doc) : null;
}

// Esportiamo le operazioni pubbliche e la normalizzazione per riuso/verifica.
module.exports = { searchBooks, getBookDetails, normalizeBook };
