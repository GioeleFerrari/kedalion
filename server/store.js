const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TICKETS_DIR = path.join(DATA_DIR, 'tickets');
const GRAPHS_DIR = path.join(DATA_DIR, 'graphs');
const FOLDERS_DIR = path.join(DATA_DIR, 'folders');

for (const dir of [TICKETS_DIR, GRAPHS_DIR, FOLDERS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

function ticketPath(id) {
  return path.join(TICKETS_DIR, `${id}.json`);
}

function graphPath(id) {
  return path.join(GRAPHS_DIR, `${id}.json`);
}

function folderPath(id) {
  return path.join(FOLDERS_DIR, `${id}.json`);
}

function isValidId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id);
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function listTickets() {
  return fs
    .readdirSync(TICKETS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(TICKETS_DIR, f), 'utf8')))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function getTicket(id) {
  if (!isValidId(id) || !fs.existsSync(ticketPath(id))) return null;
  return JSON.parse(fs.readFileSync(ticketPath(id), 'utf8'));
}

function createTicket({ title, description, folderId }) {
  const id = genId();
  const now = new Date().toISOString();
  const ticket = {
    id,
    title,
    description: description || '',
    status: 'open',
    folderId: folderId && isValidId(folderId) && fs.existsSync(folderPath(folderId)) ? folderId : null,
    createdAt: now,
    updatedAt: now,
  };
  fs.writeFileSync(ticketPath(id), JSON.stringify(ticket, null, 2));
  fs.writeFileSync(graphPath(id), JSON.stringify({ nodes: [], edges: [] }, null, 2));
  return ticket;
}

function updateTicket(id, updates) {
  const ticket = getTicket(id);
  if (!ticket) return null;
  const updated = { ...ticket, ...updates, id: ticket.id, createdAt: ticket.createdAt, updatedAt: new Date().toISOString() };
  fs.writeFileSync(ticketPath(id), JSON.stringify(updated, null, 2));
  return updated;
}

function deleteTicket(id) {
  if (!isValidId(id)) return false;
  if (fs.existsSync(ticketPath(id))) fs.unlinkSync(ticketPath(id));
  if (fs.existsSync(graphPath(id))) fs.unlinkSync(graphPath(id));
  return true;
}

function listFolders() {
  return fs
    .readdirSync(FOLDERS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(FOLDERS_DIR, f), 'utf8')))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function createFolder({ name }) {
  const id = genId();
  const now = new Date().toISOString();
  const folder = { id, name, createdAt: now };
  fs.writeFileSync(folderPath(id), JSON.stringify(folder, null, 2));
  return folder;
}

function deleteFolder(id) {
  if (!isValidId(id)) return false;
  if (fs.existsSync(folderPath(id))) fs.unlinkSync(folderPath(id));
  for (const ticket of listTickets()) {
    if (ticket.folderId === id) updateTicket(ticket.id, { folderId: null });
  }
  return true;
}

function getGraph(id) {
  if (!isValidId(id)) return null;
  if (!fs.existsSync(graphPath(id))) {
    if (!fs.existsSync(ticketPath(id))) return null;
    return { nodes: [], edges: [] };
  }
  return JSON.parse(fs.readFileSync(graphPath(id), 'utf8'));
}

function saveGraph(id, graph) {
  if (!isValidId(id) || !fs.existsSync(ticketPath(id))) return null;
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const clean = { nodes, edges };
  fs.writeFileSync(graphPath(id), JSON.stringify(clean, null, 2));
  return clean;
}

module.exports = {
  isValidId,
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  getGraph,
  saveGraph,
  listFolders,
  createFolder,
  deleteFolder,
};
