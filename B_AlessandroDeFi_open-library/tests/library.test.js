// Test d'integrazione della libreria tramite HTTP simulato con Supertest.
// App, database e registrazione utente sono forniti dal repository condiviso.
const request = require('supertest');
const app = require('../src/app');
const db = require('./db');
const Book = require('../src/models/Book');
const { registerAndLogin } = require('./helpers');
const { mockOpenLibrary, saveHobbit } = require('./openLibraryMock');

// Token dell'utente di prova; le rotte della libreria sono private.
let token;

// Il database in memoria viene condiviso durante la suite e pulito tra i casi.
beforeAll(db.connect);
beforeEach(async () => {
  token = await registerAndLogin();
});
afterEach(async () => {
  jest.restoreAllMocks();
  await db.clear();
});
afterAll(db.close);

describe('POST /api/library', () => {
  // Verifica creazione della relazione e popolamento dei riferimenti Book/Shelf.
  test('salva il libro nello scaffale "Da leggere" di default', async () => {
    const res = await saveHobbit(token);

    expect(res.status).toBe(201);
    expect(res.body.userBook.book.title).toBe('The Hobbit');
    expect(res.body.userBook.status).toBe('da_leggere');
    expect(res.body.userBook.shelf.name).toBe('Da leggere');
  });

  test('con lo stato "in_lettura" usa lo scaffale "In lettura"', async () => {
    const res = await saveHobbit(token, { status: 'in_lettura' });

    expect(res.status).toBe(201);
    expect(res.body.userBook.shelf.name).toBe('In lettura');
  });

  test('salva i dati del libro una sola volta, anche se lo aggiungono piu utenti', async () => {
    const altroToken = await registerAndLogin({ email: 'luigi@example.com', username: 'luigi' });
    await saveHobbit(token);
    await saveHobbit(altroToken);

    expect(await Book.countDocuments()).toBe(1);
  });

  test('lo stesso libro non puo essere salvato due volte (409)', async () => {
    await saveHobbit(token);
    const res = await saveHobbit(token);
    expect(res.status).toBe(409);
  });

  test('rifiuta un identificativo o uno stato non validi (400)', async () => {
    const res1 = await saveHobbit(token, { openLibraryId: 'xyz' });
    const res2 = await saveHobbit(token, { status: 'finito' });

    expect(res1.status).toBe(400);
    expect(res2.status).toBe(400);
  });

  test('se il libro non esiste su Open Library restituisce 404', async () => {
    mockOpenLibrary({ numFound: 0, docs: [] });
    const res = await request(app)
      .post('/api/library')
      .set('Authorization', `Bearer ${token}`)
      .send({ openLibraryId: 'OL1W' });

    expect(res.status).toBe(404);
  });
});

describe('GET e DELETE /api/library', () => {
  // L'elenco consente filtri ma resta sempre limitato all'utente autenticato.
  test('elenca i libri salvati e filtra per stato', async () => {
    await saveHobbit(token, { status: 'in_lettura' });

    const tutti = await request(app).get('/api/library').set('Authorization', `Bearer ${token}`);
    const letti = await request(app)
      .get('/api/library?status=letto')
      .set('Authorization', `Bearer ${token}`);

    expect(tutti.body.count).toBe(1);
    expect(letti.body.count).toBe(0);
  });

  test('restituisce il dettaglio di un libro salvato', async () => {
    const saved = await saveHobbit(token);
    const res = await request(app)
      .get(`/api/library/${saved.body.userBook._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userBook.book.authors).toEqual(['J.R.R. Tolkien']);
  });

  test('un utente non vede i libri degli altri (404)', async () => {
    const saved = await saveHobbit(token);
    const altroToken = await registerAndLogin({ email: 'luigi@example.com', username: 'luigi' });

    const res = await request(app)
      .get(`/api/library/${saved.body.userBook._id}`)
      .set('Authorization', `Bearer ${altroToken}`);
    expect(res.status).toBe(404);
  });

  test('rimuove un libro dalla libreria', async () => {
    // Si elimina la relazione personale; la lettura successiva deve dare 404.
    const saved = await saveHobbit(token);
    const id = saved.body.userBook._id;

    const del = await request(app).delete(`/api/library/${id}`).set('Authorization', `Bearer ${token}`);
    const res = await request(app).get(`/api/library/${id}`).set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(204);
    expect(res.status).toBe(404);
  });

  test('con un id non valido restituisce 400', async () => {
    const res = await request(app).get('/api/library/123').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
