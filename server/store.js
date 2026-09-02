const { db } = require('./db');

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function isValidId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id);
}

// --- Users ---

function findUserByGithubId(githubId) {
  return db.prepare('SELECT * FROM users WHERE github_id = ?').get(String(githubId));
}

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function getOrCreateLocalUser() {
  const existing = findUserByGithubId('legacy-local');
  if (existing) return existing;
  const now = new Date().toISOString();
  const info = db
    .prepare('INSERT INTO users (github_id, username, avatar_url, created_at) VALUES (?, ?, ?, ?)')
    .run('legacy-local', 'Ticket locali', null, now);
  return getUserById(info.lastInsertRowid);
}

function findOrCreateUser({ githubId, username, avatarUrl }) {
  const existing = findUserByGithubId(githubId);
  if (existing) {
    db.prepare('UPDATE users SET username = ?, avatar_url = ? WHERE id = ?').run(
      username,
      avatarUrl,
      existing.id
    );
    return getUserById(existing.id);
  }
  const now = new Date().toISOString();
  const info = db
    .prepare('INSERT INTO users (github_id, username, avatar_url, created_at) VALUES (?, ?, ?, ?)')
    .run(String(githubId), username, avatarUrl, now);
  return getUserById(info.lastInsertRowid);
}

function toUserJson(user) {
  return { id: user.id, username: user.username, avatarUrl: user.avatar_url };
}

// --- Tickets ---

function ticketRowToJson(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    folderId: row.folder_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listTickets(userId) {
  return db
    .prepare('SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId)
    .map(ticketRowToJson);
}

function getTicket(userId, id) {
  if (!isValidId(id)) return null;
  const row = db.prepare('SELECT * FROM tickets WHERE id = ? AND user_id = ?').get(id, userId);
  return row ? ticketRowToJson(row) : null;
}

function createTicket(userId, { title, description, folderId }) {
  const id = genId();
  const now = new Date().toISOString();
  const validFolderId =
    folderId && isValidId(folderId) && db.prepare('SELECT 1 FROM folders WHERE id = ? AND user_id = ?').get(folderId, userId)
      ? folderId
      : null;
  db.prepare(
    'INSERT INTO tickets (id, user_id, folder_id, title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, userId, validFolderId, title, description || '', 'open', now, now);
  db.prepare('INSERT INTO graphs (ticket_id, data) VALUES (?, ?)').run(
    id,
    JSON.stringify({ nodes: [], edges: [] })
  );
  return getTicket(userId, id);
}

function updateTicket(userId, id, updates) {
  const existing = getTicket(userId, id);
  if (!existing) return null;

  const fields = [];
  const values = [];
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.folderId !== undefined) {
    const validFolderId =
      updates.folderId && isValidId(updates.folderId) &&
      db.prepare('SELECT 1 FROM folders WHERE id = ? AND user_id = ?').get(updates.folderId, userId)
        ? updates.folderId
        : null;
    fields.push('folder_id = ?');
    values.push(validFolderId);
  }
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());

  values.push(id, userId);
  db.prepare(`UPDATE tickets SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  return getTicket(userId, id);
}

function deleteTicket(userId, id) {
  if (!isValidId(id)) return false;
  db.prepare('DELETE FROM tickets WHERE id = ? AND user_id = ?').run(id, userId);
  return true;
}

// --- Graphs ---

function getGraph(userId, id) {
  if (!isValidId(id)) return null;
  const ticket = db.prepare('SELECT 1 FROM tickets WHERE id = ? AND user_id = ?').get(id, userId);
  if (!ticket) return null;
  const row = db.prepare('SELECT data FROM graphs WHERE ticket_id = ?').get(id);
  if (!row) return { nodes: [], edges: [] };
  try {
    return JSON.parse(row.data);
  } catch {
    return { nodes: [], edges: [] };
  }
}

function saveGraph(userId, id, graph) {
  if (!isValidId(id)) return null;
  const ticket = db.prepare('SELECT 1 FROM tickets WHERE id = ? AND user_id = ?').get(id, userId);
  if (!ticket) return null;
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const clean = { nodes, edges };
  db.prepare(
    'INSERT INTO graphs (ticket_id, data) VALUES (?, ?) ON CONFLICT(ticket_id) DO UPDATE SET data = excluded.data'
  ).run(id, JSON.stringify(clean));
  db.prepare('UPDATE tickets SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);
  return clean;
}

// Returns the ids of tickets whose graph has at least one node whose label or
// description contains the query (case-insensitive). Reads every graph for the
// user, which is fine at the scale this app runs at (a personal ticket list);
// there's no indexed way to search inside the JSON blob otherwise.
function searchTicketIdsByNodeContent(userId, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const rows = db
    .prepare(
      `SELECT g.ticket_id AS ticketId, g.data FROM graphs g
       JOIN tickets t ON t.id = g.ticket_id
       WHERE t.user_id = ?`
    )
    .all(userId);
  const matches = [];
  for (const row of rows) {
    let data;
    try {
      data = JSON.parse(row.data);
    } catch {
      continue;
    }
    const nodes = Array.isArray(data.nodes) ? data.nodes : [];
    const hit = nodes.some((n) => {
      const label = (n.label || '').toLowerCase();
      const description = (n.description || '').toLowerCase();
      return label.includes(q) || description.includes(q);
    });
    if (hit) matches.push(row.ticketId);
  }
  return matches;
}

// --- Folders ---

function folderRowToJson(row) {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

function listFolders(userId) {
  return db
    .prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY sort_order, name COLLATE NOCASE')
    .all(userId)
    .map(folderRowToJson);
}

function createFolder(userId, { name }) {
  const id = genId();
  const now = new Date().toISOString();
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM folders WHERE user_id = ?').get(userId).m;
  db.prepare('INSERT INTO folders (id, user_id, name, sort_order, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id,
    userId,
    name,
    maxOrder + 1,
    now
  );
  return folderRowToJson({ id, name, created_at: now });
}

// Applies a new manual order to the user's folders: orderIds is the full list of
// folder ids in the desired order, so each one's sort_order becomes its index.
// Ids that aren't valid or don't belong to this user are silently skipped.
function reorderFolders(userId, orderIds) {
  if (!Array.isArray(orderIds)) return;
  const setOrder = db.prepare('UPDATE folders SET sort_order = ? WHERE id = ? AND user_id = ?');
  const tx = db.transaction((ids) => {
    ids.forEach((id, i) => {
      if (isValidId(id)) setOrder.run(i, id, userId);
    });
  });
  tx(orderIds);
}

function deleteFolder(userId, id) {
  if (!isValidId(id)) return false;
  db.prepare('UPDATE tickets SET folder_id = NULL WHERE folder_id = ? AND user_id = ?').run(id, userId);
  db.prepare('DELETE FROM folders WHERE id = ? AND user_id = ?').run(id, userId);
  return true;
}

module.exports = {
  isValidId,
  findOrCreateUser,
  getOrCreateLocalUser,
  getUserById,
  toUserJson,
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  getGraph,
  saveGraph,
  searchTicketIdsByNodeContent,
  listFolders,
  createFolder,
  reorderFolders,
  deleteFolder,
};
