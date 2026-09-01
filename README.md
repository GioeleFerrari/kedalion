# Kedalion

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

## Accesso

All'apertura viene mostrata una schermata di login con due opzioni:

- **Accedi con GitHub** — richiede di configurare un'app OAuth (vedi sotto). Ogni account GitHub vede solo i propri ticket.
- **Continua senza account** — modalità locale, nessun login richiesto: i ticket restano su questo computer sotto un unico account "Ticket locali". È la modalità di default se il login GitHub non è configurato.

### Configurare il login con GitHub

1. Vai su [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**.
2. Imposta:
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
3. Copia `Client ID` e genera un `Client secret`.
4. Copia `.env.example` in `.env` e compila:

   ```bash
   cp .env.example .env
   ```

   ```
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```
5. Riavvia il server (`npm start`).

Senza queste variabili l'app funziona comunque tramite l'opzione "Continua senza account".

## Dati

Ticket, cartelle e grafi sono salvati in un database SQLite locale (`data/kedalion.sqlite3`, creato automaticamente al primo avvio). La cartella `data/` non è versionata su git.

Se il progetto conteneva dati dalla vecchia versione basata su file JSON (`data/tickets/`, `data/folders/`, `data/graphs/`), vengono migrati automaticamente nel database al primo avvio, sotto un account "Ticket locali".

## Licenza

[MIT](LICENSE)
