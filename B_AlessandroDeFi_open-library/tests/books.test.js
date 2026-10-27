// Test HTTP reali contro l'app Express: Supertest simula richieste senza
// aprire una porta TCP, mentre i moduli db/helpers provengono dal progetto host.
const request = require('supertest');
const app = require('../src/app');
const db = require('./db');
const { registerAndLogin } = require('./helpers');
const { mockOpenLibrary } = require('./openLibraryMock');

// Token creato per ogni test, cosi verifichiamo endpoint protetti da JWT.
let token;

// Apre il database isolato una sola volta per la suite.
beforeAll(db.connect);
beforeEach(async () => {
  // Ogni caso parte con un utente autenticato e dati puliti.
  token = await registerAndLogin();
});
afterEach(async () => {
  // Ripristina fetch mockato e cancella i documenti creati dal test.
  jest.restoreAllMocks();
  await db.clear();
});
afterAll(db.close);

describe('GET /api/books/search', () => {
  // Senza token il middleware della rotta deve bloccare la richiesta.
  test('richiede l\'autenticazione', async () => {
    const res = await request(app).get('/api/books/search?title=hobbit');
    expect(res.status).toBe(401);
  });

  test('cerca per titolo e restituisce i dati normalizzati', async () => {
    // Evita una chiamata Internet e rende la risposta ripetibile.
    const fetchMock = mockOpenLibrary();

    const res = await request(app)
      .get('/api/books/search?title=the hobbit')
      .set('Authorization', `Bearer ${token}`);

    // Controlliamo sia il codice HTTP sia il contratto dati restituito al client.
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.results[0]).toEqual({
      openLibraryId: 'OL27448W',
      title: 'The Hobbit',
      authors: ['J.R.R. Tolkien'],
      firstPublishYear: 1937,
      numberOfPages: 300,
      subjects: ['Fantasy', 'Dragons'],
      coverUrl: 'https://covers.openlibrary.org/b/id/14627509-M.jpg',
    });
    expect(fetchMock.mock.calls[0][0]).toContain('title=the+hobbit');
  });

  test('cerca per autore e per ISBN', async () => {
    // Verifica che i criteri distinti vengano tradotti nei parametri corretti.
    const fetchMock = mockOpenLibrary();

    await request(app).get('/api/books/search?author=tolkien').set('Authorization', `Bearer ${token}`);
    await request(app)
      .get('/api/books/search?isbn=978-0-261-10221-7')
      .set('Authorization', `Bearer ${token}`);

    expect(fetchMock.mock.calls[0][0]).toContain('author=tolkien');
    expect(fetchMock.mock.calls[1][0]).toContain('isbn=9780261102217');
  });

  test('senza parametri di ricerca restituisce 400', async () => {
    // La richiesta non deve generare una query remota senza criteri.
    const res = await request(app).get('/api/books/search').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test('con un ISBN non valido restituisce 400', async () => {
    // Gli ISBN malformati si fermano nel controller senza chiamare Open Library.
    const res = await request(app)
      .get('/api/books/search?isbn=123')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test('se Open Library non risponde restituisce 502', async () => {
    // Simula un errore di rete, distinto da una risposta HTTP non-2xx.
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('rete assente'));

    const res = await request(app)
      .get('/api/books/search?title=hobbit')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(502);
  });
});

describe('GET /api/books/:olid', () => {
  test('restituisce il dettaglio del libro', async () => {
    // La risposta del dettaglio usa la stessa forma normalizzata della ricerca.
    mockOpenLibrary();

    const res = await request(app).get('/api/books/OL27448W').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.book.title).toBe('The Hobbit');
    expect(res.body.book.numberOfPages).toBe(300);
  });

  test('con un identificativo non valido restituisce 400', async () => {
    // Gli ID non conformi al formato OL...W non arrivano al servizio esterno.
    const res = await request(app).get('/api/books/abc').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test('se il libro non esiste restituisce 404', async () => {
    // Risposta valida ma vuota: il servizio e raggiungibile, l'opera non esiste.
    mockOpenLibrary({ numFound: 0, docs: [] });

    const res = await request(app).get('/api/books/OL1W').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
