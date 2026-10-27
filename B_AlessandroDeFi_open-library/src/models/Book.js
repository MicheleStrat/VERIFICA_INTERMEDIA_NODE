// Modello del catalogo condiviso: ogni documento descrive un'opera Open Library.
const mongoose = require('mongoose');

// Lo schema definisce i campi persistiti, i relativi tipi e i vincoli minimi.
const bookSchema = new mongoose.Schema(
  {
    // Identificativo Work esterno; unique evita duplicati nel catalogo locale.
    openLibraryId: { type: String, required: true, unique: true }, // es. "OL27448W"
    // Titolo obbligatorio restituito dalla normalizzazione Open Library.
    title: { type: String, required: true },
    // Autori dell'opera, memorizzati come elenco di nomi.
    authors: [String],
    // Anno della prima pubblicazione, se disponibile nel catalogo remoto.
    firstPublishYear: Number,
    // Numero medio di pagine fornito da Open Library, se disponibile.
    numberOfPages: Number,
    // Argomenti o categorie associati all'opera.
    subjects: [String],
    // URL della copertina; puo essere assente se Open Library non ne fornisce una.
    coverUrl: String,
  },
  // Aggiunge automaticamente le date di creazione e ultima modifica.
  { timestamps: true }
);

// Esclude dalla serializzazione JSON il contatore interno di versione di Mongoose.
bookSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

// Registra lo schema con Mongoose e rende il modello disponibile agli altri moduli.
module.exports = mongoose.model('Book', bookSchema);
