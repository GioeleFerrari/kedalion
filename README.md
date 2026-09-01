# Ticket Guide

App web locale per gestire ticket e organizzare i passaggi di risoluzione come grafo di nodi collegabili.

## Avvio

Richiede [Node.js](https://nodejs.org/) (versione 18 o superiore).

```bash
npm install
npm start
```

Poi apri [http://localhost:3000](http://localhost:3000) nel browser.

Di default il server ascolta sulla porta `3000`; puoi cambiarla impostando la variabile d'ambiente `PORT`:

```bash
PORT=4000 npm start
```

## Dati

Ticket, cartelle e grafi vengono salvati come file JSON nella cartella `data/` (creata automaticamente al primo avvio), che non è versionata su git.
