// Mongoose crea e valida i documenti MongoDB secondo uno schema.
const mongoose = require('mongoose');

// Catalogo comune: il documento Book descrive l'opera, non il possesso di un
// utente. La relazione personale e lo stato di lettura stanno in UserBook.
const bookSchema = new mongoose.Schema(
  {
    // L'ID esterno permette di cercare l'opera e impedisce doppioni locali.
    openLibraryId: { type: String, required: true, unique: true }, // es. "OL27448W"
    // Dati normalizzati da openLibraryService.normalizeBook().
    title: { type: String, required: true },
    authors: [String],
    firstPublishYear: Number,
    numberOfPages: Number,
    subjects: [String],
    coverUrl: String,
  },
  // timestamps aggiunge createdAt e updatedAt automaticamente.
  { timestamps: true }
);

// Rimuoviamo i dettagli interni Mongoose dalle risposte JSON dell'API.
bookSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Book', bookSchema);
