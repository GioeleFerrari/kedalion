const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'kedalion.sqlite3'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    github_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'open',
    tags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS graphs (
    ticket_id TEXT PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
    data TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_folder ON tickets(folder_id);
`);

// Older databases were created before folders had a manual sort order (they were
// always listed alphabetically); add the column and backfill it with that same
// alphabetical order so existing folder lists don't visibly reshuffle.
const folderColumns = db.prepare('PRAGMA table_info(folders)').all().map((c) => c.name);
if (!folderColumns.includes('sort_order')) {
  db.exec('ALTER TABLE folders ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0');
  const rows = db.prepare('SELECT id FROM folders ORDER BY name COLLATE NOCASE').all();
  const setOrder = db.prepare('UPDATE folders SET sort_order = ? WHERE id = ?');
  rows.forEach((row, i) => setOrder.run(i, row.id));
}

// Older databases were created before tickets had tags; add the column so
// existing tickets simply start out with no tags instead of failing to load.
const ticketColumns = db.prepare('PRAGMA table_info(tickets)').all().map((c) => c.name);
if (!ticketColumns.includes('tags')) {
  db.exec("ALTER TABLE tickets ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'");
}

// --- One-off migration from the old per-file JSON storage (data/tickets, data/folders, data/graphs) ---
// Anything found there is attached to a placeholder "Ticket locali" account so nothing is lost;
// once a real user logs in with GitHub they'll see their own separate tickets.
function migrateLegacyJsonData() {
  const ticketsCount = db.prepare('SELECT COUNT(*) AS n FROM tickets').get().n;
  if (ticketsCount > 0) return;

  const legacyTicketsDir = path.join(DATA_DIR, 'tickets');
  const legacyFoldersDir = path.join(DATA_DIR, 'folders');
  const legacyGraphsDir = path.join(DATA_DIR, 'graphs');
  if (!fs.existsSync(legacyTicketsDir)) return;

  const ticketFiles = fs.readdirSync(legacyTicketsDir).filter((f) => f.endsWith('.json'));
  if (ticketFiles.length === 0) return;

  const now = new Date().toISOString();
  let legacyUser = db.prepare('SELECT * FROM users WHERE github_id = ?').get('legacy-local');
  if (!legacyUser) {
    const info = db
      .prepare('INSERT INTO users (github_id, username, avatar_url, created_at) VALUES (?, ?, ?, ?)')
      .run('legacy-local', 'Ticket locali', null, now);
    legacyUser = { id: info.lastInsertRowid };
  }

  const insertFolder = db.prepare(
    'INSERT OR IGNORE INTO folders (id, user_id, name, created_at) VALUES (?, ?, ?, ?)'
  );
  const insertTicket = db.prepare(
    'INSERT OR IGNORE INTO tickets (id, user_id, folder_id, title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertGraph = db.prepare('INSERT OR IGNORE INTO graphs (ticket_id, data) VALUES (?, ?)');

  const migrate = db.transaction(() => {
    if (fs.existsSync(legacyFoldersDir)) {
      for (const file of fs.readdirSync(legacyFoldersDir).filter((f) => f.endsWith('.json'))) {
        const folder = JSON.parse(fs.readFileSync(path.join(legacyFoldersDir, file), 'utf8'));
        insertFolder.run(folder.id, legacyUser.id, folder.name, folder.createdAt || now);
      }
    }
    for (const file of ticketFiles) {
      const ticket = JSON.parse(fs.readFileSync(path.join(legacyTicketsDir, file), 'utf8'));
      insertTicket.run(
        ticket.id,
        legacyUser.id,
        ticket.folderId || null,
        ticket.title,
        ticket.description || '',
        ticket.status || 'open',
        ticket.createdAt || now,
        ticket.updatedAt || now
      );
      const graphFile = path.join(legacyGraphsDir, `${ticket.id}.json`);
      if (fs.existsSync(graphFile)) {
        insertGraph.run(ticket.id, fs.readFileSync(graphFile, 'utf8'));
      } else {
        insertGraph.run(ticket.id, JSON.stringify({ nodes: [], edges: [] }));
      }
    }
  });
  migrate();

  console.log(`Migrati ${ticketFiles.length} ticket locali nel database (utente "Ticket locali").`);
}

migrateLegacyJsonData();

function getOrCreateSessionSecret() {
  const secretPath = path.join(DATA_DIR, '.session-secret');
  if (fs.existsSync(secretPath)) return fs.readFileSync(secretPath, 'utf8').trim();
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(secretPath, secret, { mode: 0o600 });
  return secret;
}

module.exports = { db, getOrCreateSessionSecret };
