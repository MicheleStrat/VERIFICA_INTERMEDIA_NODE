// Utility per i test d'integrazione: usa Supertest contro l'app condivisa.
const request = require('supertest');
const app = require('../src/app');

// Risposta realistica ma ridotta dell'API esterna.
// I test non dipendono dalla rete e possono controllare la normalizzazione.
const hobbitDoc = {
  key: '/works/OL27448W',
  title: 'The Hobbit',
  author_name: ['J.R.R. Tolkien'],
  first_publish_year: 1937,
  number_of_pages_median: 300,
  cover_i: 14627509,
  subject: ['Fantasy', 'Dragons'],
};

// Sostituisce global.fetch: il servizio Open Library riceve una risposta HTTP
// simulata con lo stesso contratto minimo usato dal codice (ok/status/json).
function mockOpenLibrary(data = { numFound: 1, docs: [hobbitDoc] }) {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => data,
  });
}

// Helper di alto livello riutilizzato dai test di libreria: simula il catalogo,
// invia la richiesta autenticata e restituisce la risposta Supertest.
async function saveHobbit(token, body = {}) {
  mockOpenLibrary();
  return request(app)
    .post('/api/library')
    .set('Authorization', `Bearer ${token}`)
    .send({ openLibraryId: 'OL27448W', ...body });
}

module.exports = { hobbitDoc, mockOpenLibrary, saveHobbit };
