const express = require('express');
const path = require('path');
const store = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/tickets', (req, res) => {
  res.json(store.listTickets());
});

app.post('/api/tickets', (req, res) => {
  const { title, description, folderId } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const ticket = store.createTicket({ title: title.trim(), description, folderId });
  res.status(201).json(ticket);
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = store.getTicket(req.params.id);
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
  const ticket = store.updateTicket(req.params.id, updates);
  if (!ticket) return res.status(404).json({ error: 'not found' });
  res.json(ticket);
});

app.delete('/api/tickets/:id', (req, res) => {
  store.deleteTicket(req.params.id);
  res.status(204).end();
});

app.get('/api/folders', (req, res) => {
  res.json(store.listFolders());
});

app.post('/api/folders', (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const folder = store.createFolder({ name: name.trim() });
  res.status(201).json(folder);
});

app.delete('/api/folders/:id', (req, res) => {
  store.deleteFolder(req.params.id);
  res.status(204).end();
});

app.get('/api/tickets/:id/graph', (req, res) => {
  const graph = store.getGraph(req.params.id);
  if (!graph) return res.status(404).json({ error: 'not found' });
  res.json(graph);
});

app.put('/api/tickets/:id/graph', (req, res) => {
  const graph = store.saveGraph(req.params.id, req.body || {});
  if (!graph) return res.status(404).json({ error: 'not found' });
  res.json(graph);
});

app.listen(PORT, () => {
  console.log(`Ticket guide in ascolto su http://localhost:${PORT}`);
});
