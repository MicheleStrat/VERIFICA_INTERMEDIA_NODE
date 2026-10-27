// Funzioni di accesso alla libreria personale riusabili dai controller.
const mongoose = require('mongoose');
const UserBook = require('../models/UserBook');
const httpError = require('../utils/httpError');

// Cerca una relazione utente-libro e verifica che appartenga proprio all'utente.
// In caso contrario risponde 404; questo evita di rivelare se l'ID appartiene
// a qualcun altro (e impedisce accessi non autorizzati ai suoi dati).
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

// Condiviso da GET singolo e DELETE nella libreria.
module.exports = { findUserBook };
