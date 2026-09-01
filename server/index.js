require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const store = require('./store');
const { getOrCreateSessionSecret } = require('./db');
const auth = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(express.json());
app.use(
  session({
    secret: getOrCreateSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 giorni
      sameSite: 'lax',
    },
  })
);
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/auth', auth.router);

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'not authenticated' });
  const user = store.getUserById(req.session.userId);
  if (!user) return res.status(401).json({ error: 'not authenticated' });
  res.json({ ...store.toUserJson(user), githubLoginEnabled: auth.isConfigured() });
});

app.get('/api/config', (req, res) => {
  res.json({ githubLoginEnabled: auth.isConfigured() });
});

app.use('/api', auth.requireAuth);

app.get('/api/tickets', (req, res) => {
  res.json(store.listTickets(req.session.userId));
});

app.post('/api/tickets', (req, res) => {
  const { title, description, folderId } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const ticket = store.createTicket(req.session.userId, { title: title.trim(), description, folderId });
  res.status(201).json(ticket);
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = store.getTicket(req.session.userId, req.params.id);
  if (!ticket) return res.status(404).json({ error: 'not found' });
  res.json(ticket);
});

app.put('/api/tickets/:id', (req, res) => {
  const { title, description, status, folderId } = req.body || {};
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (folderId !== undefined) updates.folderId = folderId;
  const ticket = store.updateTicket(req.session.userId, req.params.id, updates);
  if (!ticket) return res.status(404).json({ error: 'not found' });
  res.json(ticket);
});

app.delete('/api/tickets/:id', (req, res) => {
  store.deleteTicket(req.session.userId, req.params.id);
  res.status(204).end();
});

app.get('/api/folders', (req, res) => {
  res.json(store.listFolders(req.session.userId));
});

app.post('/api/folders', (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const folder = store.createFolder(req.session.userId, { name: name.trim() });
  res.status(201).json(folder);
});

app.delete('/api/folders/:id', (req, res) => {
  store.deleteFolder(req.session.userId, req.params.id);
  res.status(204).end();
});

app.get('/api/tickets/:id/graph', (req, res) => {
  const graph = store.getGraph(req.session.userId, req.params.id);
  if (!graph) return res.status(404).json({ error: 'not found' });
  res.json(graph);
});

app.put('/api/tickets/:id/graph', (req, res) => {
  const graph = store.saveGraph(req.session.userId, req.params.id, req.body || {});
  if (!graph) return res.status(404).json({ error: 'not found' });
  res.json(graph);
});

app.listen(PORT, () => {
  console.log(`Ticket guide in ascolto su http://localhost:${PORT}`);
  if (!auth.isConfigured()) {
    console.log(
      'Login con GitHub non configurato: imposta GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET (vedi README) per abilitarlo.'
    );
  }
});
