DOCENTE 
    Unità Formativa Programmazione - Node.Js 
    Argomento Verifica Intermedia 

1. Descrizione del progetto 
BookTrack è una piattaforma dove gli utenti possono: 
● Registrarsi e autenticarsi tramite Bearer Token (JWT). 
● Cercare e salvare libri utilizzando l'API di Open Library. 
● Creare scaffali personali di libri da leggere. 
● Segnare i libri come "da leggere", "in lettura" o "letti". 
● Aggiornare il proprio avanzamento di lettura (pagina corrente). 
● Lasciare una valutazione personale e una recensione sui libri salvati. 
2. Requisiti funzionali 
Il progetto è diviso in macro-funzionalità: 


-Alessio

A. Gestione utenti 
● Registrazione, login e logout. 
● Autenticazione tramite Bearer Token con Passport.js e JWT. 
● L'utente autenticato può cercare libri, salvarli nei propri scaffali, valutarli e 
recensirli. 


-Alessandro

B.  Integrazione Open Library 
● Ricerca di libri per titolo, autore o ISBN tramite l'API di Open Library 
(https://openlibrary.org/developers/api). 
● Visualizzazione di dettagli come: titolo, autori, anno di pubblicazione, 
numero di pagine, generi (subjects) e copertina. 
● Salvataggio dei libri preferiti nel database personale dell'utente. 


-Michele

C. Gestione contenuti personali 
● Creazione di scaffali personali di libri ("Da leggere", "In lettura", "Letti", ecc.). 
● Spostamento di un libro da uno scaffale all'altro, modifica o rimozione. 
● Aggiornamento della pagina corrente per i libri "in lettura", con calcolo della 
percentuale di avanzamento. 
● Possibilità di lasciare recensioni e valutazioni (da 1 a 5) per ogni libro salvato. 




professore se sarò io a consegnare il progetto voglio che sappia che nel corso precedente a me hanno insegnato che i readme sei fanno sempre come .MD questo readme in oltre è solo una copia organizzata della sua consegna con aggiunte le divisioni che ci siamo dati durante l'analisi del progetto, in caso può chiedere al professore Leone Michele o al professore Bogliaccino

De Filippis Alessandro



Questo codice deriva dalla collaborazione di De Filippis Alessandro, Alessio Bonina e Michele Strat che 
utilizzando codice già creato precedentemente durante le sue lezioni e seguendo i suoi esercizi sia in classe che a casa in modo tale da essere pronti alla verifica odierna dovendo modificare in minima parte
il codice riciclato, i commenti sono stati scritti con l'aiuto dell'autocompilatore Copilot presente all'interno dell'IDE VS Code