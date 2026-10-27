// Funzioni di accesso alla libreria personale riusabili dai controller.
const mongoose = require('mongoose');
const UserBook = require('../models/UserBook');
const httpError = require('../utils/httpError');

/**
 * Recupera una voce della libreria solo se appartiene all'utente indicato.
 * Include i documenti Book e Shelf collegati per la risposta del controller.
 * @param {string|import('mongoose').Types.ObjectId} userId Proprietario richiesto.
 * @param {string} userBookId Identificativo MongoDB della voce di libreria.
 * @returns {Promise<import('../models/UserBook')>} Relazione con libro e scaffale popolati.
 * @throws {Error} Errore HTTP 400 se l'identificativo non e valido; 404 se non trovato.
 */
async function findUserBook(userId, userBookId) {
  // Controlliamo la forma dell'ObjectId prima di interrogare MongoDB.
  if (!mongoose.isValidObjectId(userBookId)) {
    throw httpError(400, 'Id del libro salvato non valido');
  }
  // Il filtro combinato limita il risultato all'elemento richiesto e al proprietario.
  // populate recupera i dati del libro e dello scaffale collegati.
  const userBook = await UserBook.findOne({ _id: userBookId, user: userId }).populate([
    'book',
    'shelf',
  ]);
  if (!userBook) {
    throw httpError(404, 'Libro non presente nella tua libreria');
  }
  return userBook;
}

// Condivisa dagli endpoint di lettura e rimozione della libreria.
module.exports = { findUserBook };
