// L'oggetto UserBook rappresenta il legame tra un utente e un libro del catalogo.
const mongoose = require('mongoose');
const STATUSES = require('../config/statuses');

// Libro salvato da un utente nella propria libreria.
const userBookSchema = new mongoose.Schema(
  {
    // ref consente a Mongoose di popolare i riferimenti quando serve restituirli.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    shelf: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelf', required: true },
    status: {
      type: String,
      enum: { values: STATUSES, message: 'Stato non valido' },
      default: 'da_leggere',
    },
  },
  // Le date permettono anche l'ordinamento per ultima modifica in libreria.
  { timestamps: true }
);

// Uno stesso utente non puo salvare due volte lo stesso libro.
// Indice composto: lo stesso libro e ammesso in librerie diverse, ma una sola
// volta per ciascun utente. Il controller intercetta il doppione prima del save;
// l'indice protegge anche da richieste simultanee.
userBookSchema.index({ user: 1, book: 1 }, { unique: true });

// Non esponiamo __v, contatore interno usato da Mongoose per la versione.
userBookSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('UserBook', userBookSchema);
