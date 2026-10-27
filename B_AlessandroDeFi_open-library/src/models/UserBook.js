// Modello della relazione personale fra un utente e un libro del catalogo.
const mongoose = require('mongoose');
const STATUSES = require('../config/statuses');

// Lo schema conserva i riferimenti e i dati specifici della libreria personale.
const userBookSchema = new mongoose.Schema(
  {
    // Utente proprietario della relazione; ref abilita il popolamento Mongoose.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Libro condiviso a cui si riferisce questa voce della libreria.
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    // Scaffale personale in cui l'utente ha inserito il libro.
    shelf: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelf', required: true },
    // Stato di lettura limitato ai valori definiti nella configurazione comune.
    status: {
      type: String,
      enum: { values: STATUSES, message: 'Stato non valido' },
      default: 'da_leggere',
    },
  },
  // Aggiunge le date di creazione e modifica, usate anche per ordinare la libreria.
  { timestamps: true }
);

// Impedisce che lo stesso utente inserisca piu volte lo stesso libro.
// Utenti diversi possono comunque avere una relazione con il medesimo Book.
userBookSchema.index({ user: 1, book: 1 }, { unique: true });

// Esclude dalla risposta JSON il contatore interno di versione di Mongoose.
userBookSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

// Registra lo schema con Mongoose e rende il modello disponibile agli altri moduli.
module.exports = mongoose.model('UserBook', userBookSchema);
