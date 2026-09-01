const state = {
  tickets: [],
  folders: [],
  currentTicketId: null,
  graph: { nodes: [], edges: [] },
  mode: 'idle', // 'idle' | 'link'
  linkFirst: null,
  selected: null, // { type: 'node'|'edge', id }
  multiSelected: new Set(), // node ids selected via marquee / shift-click, moved together
  searchQuery: '',
  collapsedFolders: new Set(),
};

const el = {
  ticketTree: document.getElementById('ticket-tree'),
  newTicketBtn: document.getElementById('new-ticket-btn'),
  searchBtn: document.getElementById('search-btn'),
  newFolderBtn: document.getElementById('new-folder-btn'),
  searchBox: document.getElementById('search-box'),
  searchInput: document.getElementById('search-input'),
  brandIcon: document.getElementById('brand-icon'),
  emptyState: document.getElementById('empty-state'),
  emptyIcon: document.getElementById('empty-icon'),
  ticketView: document.getElementById('ticket-view'),
  ticketTitle: document.getElementById('ticket-title'),
  ticketDesc: document.getElementById('ticket-desc'),
  svg: document.getElementById('graph-svg'),
  addNodeBtn: document.getElementById('add-node-btn'),
  startNodeBtn: document.getElementById('start-node-btn'),
  endNodeBtn: document.getElementById('end-node-btn'),
  linkModeBtn: document.getElementById('link-mode-btn'),
  deleteSelectionBtn: document.getElementById('delete-selection-btn'),
  linkHint: document.getElementById('link-hint'),
  contextMenu: document.getElementById('context-menu'),

  nodeFormPopover: document.getElementById('node-form-popover'),
  nodeForm: document.getElementById('node-form'),
  nodeFormTitle: document.getElementById('node-form-title'),
  nodeFormTitleHint: document.getElementById('node-form-title-hint'),
  nodeFormDesc: document.getElementById('node-form-desc'),
  nodeFormCancel: document.getElementById('node-form-cancel'),

  nodeViewPopover: document.getElementById('node-view-popover'),
  nodeViewTitle: document.getElementById('node-view-title'),
  nodeViewDesc: document.getElementById('node-view-desc'),
  nodeViewEmpty: document.getElementById('node-view-empty'),
  nodeViewEdit: document.getElementById('node-view-edit'),

  ticketFormPopover: document.getElementById('ticket-form-popover'),
  ticketForm: document.getElementById('ticket-form'),
  ticketFormTitle: document.getElementById('ticket-form-title'),
  ticketFormDesc: document.getElementById('ticket-form-desc'),
  ticketFormFolder: document.getElementById('ticket-form-folder'),
  ticketFormCancel: document.getElementById('ticket-form-cancel'),

  folderFormPopover: document.getElementById('folder-form-popover'),
  folderForm: document.getElementById('folder-form'),
  folderFormName: document.getElementById('folder-form-name'),
  folderFormCancel: document.getElementById('folder-form-cancel'),

  loginScreen: document.getElementById('login-screen'),
  appRoot: document.getElementById('app-root'),
  loginBrandIcon: document.getElementById('login-brand-icon'),
  githubLoginBtn: document.getElementById('github-login-btn'),
  githubLoginIcon: document.getElementById('github-login-icon'),
  localLoginBtn: document.getElementById('local-login-btn'),
  loginConfigHint: document.getElementById('login-config-hint'),
  userAvatar: document.getElementById('user-avatar'),
  userAvatarFallback: document.getElementById('user-avatar-fallback'),
  userName: document.getElementById('user-name'),
  logoutBtn: document.getElementById('logout-btn'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),

  importBtn: document.getElementById('import-btn'),
  importFileInput: document.getElementById('import-file-input'),
  exportTicketBtn: document.getElementById('export-ticket-btn'),

  toast: document.getElementById('toast'),
};

let toastTimer = null;
function showToast(message, kind) {
  clearTimeout(toastTimer);
  el.toast.textContent = message;
  el.toast.className = 'toast' + (kind ? ` ${kind}` : '');
  el.toast.hidden = false;
  toastTimer = setTimeout(() => {
    el.toast.hidden = true;
  }, 3200);
}

const NODE_HEIGHT = 48;
const NODE_WIDTH = 170;
const NODE_RX = 10;
const NODE_LABEL_MAX_CHARS = 20;
const SVG_NS = 'http://www.w3.org/2000/svg';

function nodeWidth() {
  return NODE_WIDTH;
}

function truncateLabel(label) {
  if (label.length <= NODE_LABEL_MAX_CHARS) return label;
  return `${label.slice(0, NODE_LABEL_MAX_CHARS - 1).trimEnd()}…`;
}

// --- Static icon placement ---
el.brandIcon.innerHTML = svgIcon('ticket', 17);
el.emptyIcon.innerHTML = svgIcon('ticket', 20);
el.newTicketBtn.innerHTML = svgIcon('plus', 16);
el.searchBtn.innerHTML = svgIcon('search', 16);
el.newFolderBtn.innerHTML = svgIcon('folderPlus', 16);
el.importBtn.innerHTML = svgIcon('upload', 16);
el.nodeViewEdit.innerHTML = svgIcon('pencil', 13);
el.loginBrandIcon.innerHTML = svgIcon('ticket', 26);
el.githubLoginIcon.innerHTML = svgIconSolid('github', 18);
el.logoutBtn.innerHTML = svgIcon('x', 13);
el.logoutBtn.title = 'Esci';
document.querySelectorAll('.btn-icon[data-icon]').forEach((elm) => {
  elm.innerHTML = svgIcon(elm.dataset.icon, 14);
});

// --- Theme (light/dark) ---

const THEME_STORAGE_KEY = 'kedalion-theme';

function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme) {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  el.themeToggleBtn.innerHTML = svgIcon(theme === 'dark' ? 'sun' : 'moon', 13);
  el.themeToggleBtn.title = theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro';
}

applyTheme(getCurrentTheme());

el.themeToggleBtn.addEventListener('click', () => {
  const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch (e) {
    // Storage may be unavailable (private browsing, quota); the theme still applies for this session.
  }
});

async function api(path, opts) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (res.status === 401) {
    window.location.reload();
    throw new Error('not authenticated');
  }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function renderMarkdown(text) {
  if (!text || !text.trim()) return '';
  const html = marked.parse(text, { breaks: true });
  return DOMPurify.sanitize(html);
}

// --- Write/Preview tabs for markdown textareas ---

document.querySelectorAll('.md-tabs').forEach((tabs) => {
  const target = tabs.dataset.target;
  const textarea = document.getElementById(`${target}-desc`);
  const preview = document.getElementById(`${target}-desc-preview`);
  tabs.querySelectorAll('.md-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      tabs.querySelectorAll('.md-tab').forEach((t) => t.classList.toggle('active', t === tab));
      if (mode === 'preview') {
        preview.innerHTML = renderMarkdown(textarea.value);
        textarea.hidden = true;
        preview.hidden = false;
      } else {
        textarea.hidden = false;
        preview.hidden = true;
      }
    });
  });
});

function resetMarkdownTabs(target) {
  const tabs = document.querySelector(`.md-tabs[data-target="${target}"]`);
  const textarea = document.getElementById(`${target}-desc`);
  const preview = document.getElementById(`${target}-desc-preview`);
  tabs.querySelectorAll('.md-tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === 'write'));
  textarea.hidden = false;
  preview.hidden = true;
}

// --- Markdown formatting shortcuts (bold / code) ---

function wrapSelection(textarea, marker) {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  textarea.value = `${before}${marker}${selected}${marker}${after}`;
  const cursor = selected
    ? selectionStart + marker.length + selected.length + marker.length
    : selectionStart + marker.length;
  textarea.setSelectionRange(cursor, cursor);
}

document.querySelectorAll('.md-tabs').forEach((tabs) => {
  const textarea = document.getElementById(`${tabs.dataset.target}-desc`);
  textarea.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key === 'b' || e.key === 'B') {
      e.preventDefault();
      wrapSelection(textarea, '**');
    } else if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      wrapSelection(textarea, '`');
    }
  });
});

// --- Data loading ---

async function loadAll() {
  const [tickets, folders] = await Promise.all([api('/api/tickets'), api('/api/folders')]);
  state.tickets = tickets;
  state.folders = folders;
  renderTicketTree();
  populateFolderSelect();
}

// --- Sidebar tree ---

function populateFolderSelect() {
  const select = el.ticketFormFolder;
  const current = select.value;
  select.innerHTML = '<option value="">Nessuna cartella</option>';
  for (const folder of state.folders) {
    const opt = document.createElement('option');
    opt.value = folder.id;
    opt.textContent = folder.name;
    select.appendChild(opt);
  }
  select.value = current;
}

function renderTicketTree() {
  const query = state.searchQuery.trim().toLowerCase();
  const filtered = query
    ? state.tickets.filter((t) => t.title.toLowerCase().includes(query))
    : state.tickets;

  el.ticketTree.innerHTML = '';

  if (state.tickets.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'tree-empty';
    empty.textContent = 'Nessun ticket. Creane uno con il pulsante +.';
    el.ticketTree.appendChild(empty);
    return;
  }

  if (query && filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'tree-empty';
    empty.textContent = 'Nessun ticket corrisponde alla ricerca.';
    el.ticketTree.appendChild(empty);
    return;
  }

  const byFolder = new Map();
  const unfiled = [];
  for (const t of filtered) {
    if (t.folderId && state.folders.some((f) => f.id === t.folderId)) {
      if (!byFolder.has(t.folderId)) byFolder.set(t.folderId, []);
      byFolder.get(t.folderId).push(t);
    } else {
      unfiled.push(t);
    }
  }

  for (const folder of state.folders) {
    const items = byFolder.get(folder.id) || [];
    if (query && items.length === 0) continue;
    el.ticketTree.appendChild(renderFolderGroup(folder, items));
  }

  // Always render the "unfiled" bucket (even empty) so it stays a valid drag-and-drop
  // target for moving a ticket out of a folder; only hide it while a search matches nothing.
  if (!(query && unfiled.length === 0)) {
    el.ticketTree.appendChild(renderFolderGroup(null, unfiled));
  }
}

function renderFolderGroup(folder, tickets) {
  const wrapper = document.createElement('div');
  wrapper.className = 'folder-group';

  const key = folder ? folder.id : '__unfiled__';
  const collapsed = state.collapsedFolders.has(key);

  const header = document.createElement('div');
  header.className = 'folder-header' + (collapsed ? ' collapsed' : '');
  header.innerHTML = `
    <span class="chevron">${svgIcon('chevronDown', 14)}</span>
    <span class="folder-icon">${svgIcon('folder', 14)}</span>
    <span class="folder-name"></span>
    <span class="folder-count"></span>
    ${folder ? `<button class="folder-delete" title="Elimina cartella">${svgIcon('trash', 13)}</button>` : ''}
  `;
  header.querySelector('.folder-name').textContent = folder ? folder.name : 'Senza cartella';
  header.querySelector('.folder-count').textContent = tickets.length;

  const itemsWrap = document.createElement('div');
  itemsWrap.className = 'folder-items' + (collapsed ? ' collapsed' : '');

  header.addEventListener('click', (e) => {
    if (e.target.closest('.folder-delete')) return;
    if (state.collapsedFolders.has(key)) state.collapsedFolders.delete(key);
    else state.collapsedFolders.add(key);
    renderTicketTree();
  });

  header.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    header.classList.add('drop-target');
  });
  header.addEventListener('dragleave', () => header.classList.remove('drop-target'));
  header.addEventListener('drop', async (e) => {
    e.preventDefault();
    header.classList.remove('drop-target');
    const ticketId = e.dataTransfer.getData('text/plain');
    if (!ticketId) return;
    const ticket = state.tickets.find((t) => t.id === ticketId);
    const targetFolderId = folder ? folder.id : null;
    if (!ticket || (ticket.folderId || null) === targetFolderId) return;
    await api(`/api/tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify({ folderId: targetFolderId }),
    });
    await loadAll();
  });

  if (folder) {
    header.querySelector('.folder-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm(`Eliminare la cartella "${folder.name}"? I ticket al suo interno non verranno eliminati.`)) return;
      await api(`/api/folders/${folder.id}`, { method: 'DELETE' });
      await loadAll();
      showToast(`Cartella "${folder.name}" eliminata.`, 'success');
    });
  }

  for (const t of tickets) {
    itemsWrap.appendChild(renderTicketItem(t));
  }
  if (tickets.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'tree-empty';
    empty.textContent = 'Vuota';
    itemsWrap.appendChild(empty);
  }

  wrapper.appendChild(header);
  wrapper.appendChild(itemsWrap);
  return wrapper;
}

function formatRelativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'adesso';
  if (diffMin < 60) return `${diffMin} min fa`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} h fa`;
  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return 'ieri';
  if (diffD < 7) return `${diffD} g fa`;
  if (diffD < 30) return `${Math.round(diffD / 7)} sett fa`;
  if (diffD < 365) return `${Math.round(diffD / 30)} mesi fa`;
  const years = Math.round(diffD / 365);
  return `${years} ${years === 1 ? 'anno' : 'anni'} fa`;
}

function renderTicketItem(t) {
  const item = document.createElement('div');
  const statusClass = t.status === 'done' ? 'status-done' : 'status-open';
  item.className = `ticket-item ${statusClass}` + (t.id === state.currentTicketId ? ' active' : '');
  item.innerHTML = `
    <div class="t-info">
      <div class="t-title"></div>
      <div class="t-meta">
        <span class="t-badge"></span>
        <span class="t-time"></span>
      </div>
    </div>
    <button class="delete-ticket" title="Elimina ticket">${svgIcon('trash', 13)}</button>
  `;
  item.querySelector('.t-title').textContent = t.title;
  item.querySelector('.t-badge').textContent = t.status === 'done' ? 'Completato' : 'Aperto';
  item.querySelector('.t-time').textContent = formatRelativeTime(t.updatedAt || t.createdAt);
  item.setAttribute('draggable', 'true');
  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', t.id);
    e.dataTransfer.effectAllowed = 'move';
    item.classList.add('dragging');
  });
  item.addEventListener('dragend', () => item.classList.remove('dragging'));
  item.addEventListener('click', (e) => {
    if (e.target.closest('.delete-ticket')) return;
    selectTicket(t.id);
  });
  item.querySelector('.delete-ticket').addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm(`Eliminare il ticket "${t.title}"?`)) return;
    await api(`/api/tickets/${t.id}`, { method: 'DELETE' });
    if (state.currentTicketId === t.id) {
      state.currentTicketId = null;
      showEmptyState();
    }
    await loadAll();
    showToast(`Ticket "${t.title}" eliminato.`, 'success');
  });
  return item;
}

async function selectTicket(id) {
  state.currentTicketId = id;
  state.mode = 'idle';
  state.linkFirst = null;
  state.selected = null;
  state.multiSelected.clear();
  closeAllPopovers();
  hideContextMenu();
  updateLinkModeUI();
  renderTicketTree();

  // Stale interaction state from the previous ticket's graph (e.g. a drag whose
  // "suppress the next click" flag never got consumed because you switched
  // tickets right after) would otherwise eat the first click on the new graph.
  dragState = null;
  groupDragState = null;
  marqueeState = null;
  suppressNextClick = false;
  suppressNextCanvasClick = false;

  const ticket = state.tickets.find((t) => t.id === id) || (await api(`/api/tickets/${id}`));
  el.ticketTitle.textContent = ticket.title;
  el.ticketDesc.innerHTML = renderMarkdown(ticket.description);
  el.emptyState.hidden = true;
  el.ticketView.hidden = false;

  state.graph = await api(`/api/tickets/${id}/graph`);
  renderGraph();
}

function showEmptyState() {
  state.selected = null;
  state.multiSelected.clear();
  el.emptyState.hidden = false;
  el.ticketView.hidden = true;
  renderTicketTree();
}

// --- Sidebar toolbar actions ---

el.searchBtn.addEventListener('click', () => {
  const showing = el.searchBox.hidden;
  el.searchBox.hidden = !showing;
  el.searchBtn.classList.toggle('active', showing);
  if (showing) {
    el.searchInput.focus();
  } else {
    el.searchInput.value = '';
    state.searchQuery = '';
    renderTicketTree();
  }
});

el.searchInput.addEventListener('input', () => {
  state.searchQuery = el.searchInput.value;
  renderTicketTree();
});

el.newTicketBtn.addEventListener('click', () => {
  resetMarkdownTabs('ticket-form');
  const btnRect = el.newTicketBtn.getBoundingClientRect();
  openFormPopover(el.ticketFormPopover, btnRect.right + 8, btnRect.top, () => el.ticketFormTitle.focus());
});

el.ticketFormCancel.addEventListener('click', () => closeFormPopover(el.ticketFormPopover, el.ticketForm));

el.ticketForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = el.ticketFormTitle.value.trim();
  if (!title) return;
  const description = el.ticketFormDesc.value.trim();
  const folderId = el.ticketFormFolder.value || undefined;
  closeFormPopover(el.ticketFormPopover, el.ticketForm);
  const ticket = await api('/api/tickets', {
    method: 'POST',
    body: JSON.stringify({ title, description, folderId }),
  });
  await loadAll();
  selectTicket(ticket.id);
});

el.newFolderBtn.addEventListener('click', () => {
  const btnRect = el.newFolderBtn.getBoundingClientRect();
  openFormPopover(el.folderFormPopover, btnRect.right + 8, btnRect.top, () => el.folderFormName.focus());
});

el.folderFormCancel.addEventListener('click', () => closeFormPopover(el.folderFormPopover, el.folderForm));

el.folderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = el.folderFormName.value.trim();
  if (!name) return;
  closeFormPopover(el.folderFormPopover, el.folderForm);
  await api('/api/folders', { method: 'POST', body: JSON.stringify({ name }) });
  await loadAll();
});

// --- Ticket import / export ---

function slugifyFilename(title) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (slug || 'ticket') + '.json';
}

el.exportTicketBtn.addEventListener('click', () => {
  const ticket = state.tickets.find((t) => t.id === state.currentTicketId);
  if (!ticket) return;
  const payload = {
    kedalionExport: 1,
    ticket: {
      title: ticket.title,
      description: ticket.description || '',
      status: ticket.status || 'open',
    },
    graph: {
      nodes: state.graph.nodes,
      edges: state.graph.edges,
    },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = slugifyFilename(ticket.title);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Ticket esportato.', 'success');
});

el.importBtn.addEventListener('click', () => {
  el.importFileInput.value = '';
  el.importFileInput.click();
});

el.importFileInput.addEventListener('change', async () => {
  const file = el.importFileInput.files && el.importFileInput.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const importedTicket = data.ticket || data; // tolerate a bare {title, description, ...} file too
    const title = (importedTicket.title || '').trim();
    if (!title) throw new Error('missing title');
    const description = importedTicket.description || '';

    const created = await api('/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });

    const importedGraph = data.graph || {};
    const nodes = Array.isArray(importedGraph.nodes) ? importedGraph.nodes : [];
    const edges = Array.isArray(importedGraph.edges) ? importedGraph.edges : [];
    if (nodes.length > 0 || edges.length > 0) {
      await api(`/api/tickets/${created.id}/graph`, {
        method: 'PUT',
        body: JSON.stringify({ nodes, edges }),
      });
    }

    await loadAll();
    selectTicket(created.id);
    showToast('Ticket importato correttamente.', 'success');
  } catch (err) {
    showToast('Import non riuscito: il file selezionato non sembra un export valido di Kedalion.', 'error');
  }
});

// --- Generic popover helpers (used by ticket/folder forms) ---

let openPopoverEl = null;

function openFormPopover(popover, clientX, clientY, afterOpen) {
  closeAllPopovers();
  popover.hidden = false;
  const margin = 12;
  const w = popover.offsetWidth || 290;
  const h = popover.offsetHeight || 200;
  let left = Math.min(clientX, window.innerWidth - w - margin);
  let top = Math.min(clientY, window.innerHeight - h - margin);
  left = Math.max(margin, left);
  top = Math.max(margin, top);
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  openPopoverEl = popover;
  if (afterOpen) requestAnimationFrame(afterOpen);
  setTimeout(() => document.addEventListener('click', onGenericPopoverOutsideClick), 0);
}

function closeFormPopover(popover, form) {
  popover.hidden = true;
  if (openPopoverEl === popover) openPopoverEl = null;
  form.reset();
  document.removeEventListener('click', onGenericPopoverOutsideClick);
}

function onGenericPopoverOutsideClick(e) {
  if (openPopoverEl && !openPopoverEl.contains(e.target)) {
    if (openPopoverEl === el.ticketFormPopover) closeFormPopover(el.ticketFormPopover, el.ticketForm);
    else if (openPopoverEl === el.folderFormPopover) closeFormPopover(el.folderFormPopover, el.folderForm);
  }
}

function closeAllPopovers() {
  if (!el.ticketFormPopover.hidden) closeFormPopover(el.ticketFormPopover, el.ticketForm);
  if (!el.folderFormPopover.hidden) closeFormPopover(el.folderFormPopover, el.folderForm);
  if (!el.nodeViewPopover.hidden) closeNodeView();
  closeNodeForm();
}

// --- Graph: node CRUD ---

function addNodeAt(x, y, clientX, clientY) {
  openNodeForm({
    clientX,
    clientY,
    initial: { label: '', description: '' },
    onSubmit: ({ label, description }) => {
      const node = { id: genId(), label, description, done: false, x, y };
      state.graph.nodes.push(node);
      renderGraph();
      saveGraph();
    },
  });
}

function addConnectedNode(sourceNode, clientX, clientY) {
  const x = sourceNode.x + nodeWidth(sourceNode) / 2 + 110;
  const y = sourceNode.y;
  openNodeForm({
    clientX,
    clientY,
    initial: { label: '', description: '' },
    onSubmit: ({ label, description }) => {
      const newNode = { id: genId(), label, description, done: false, x, y };
      state.graph.nodes.push(newNode);
      state.graph.edges.push({ id: genId(), from: sourceNode.id, to: newNode.id });
      renderGraph();
      saveGraph();
    },
  });
}

function editNode(node, clientX, clientY) {
  openNodeForm({
    clientX,
    clientY,
    initial: { label: node.label, description: node.description || '' },
    lockTitle: !!node.nodeType,
    onSubmit: ({ label, description }) => {
      if (!node.nodeType) node.label = label;
      node.description = description;
      renderGraph();
      saveGraph();
    },
  });
}

// --- Node description view popover ---

let nodeViewState = null;

function viewNodeDescription(node, clientX, clientY) {
  closeAllPopovers();
  nodeViewState = { node };
  el.nodeViewTitle.textContent = node.label;
  const hasDesc = !!(node.description && node.description.trim());
  el.nodeViewDesc.hidden = !hasDesc;
  el.nodeViewDesc.innerHTML = hasDesc ? renderMarkdown(node.description) : '';
  el.nodeViewEmpty.hidden = hasDesc;

  const popover = el.nodeViewPopover;
  popover.hidden = false;
  const margin = 12;
  const w = popover.offsetWidth || 290;
  const h = popover.offsetHeight || 120;
  let left = (clientX ?? window.innerWidth / 2) + 8;
  let top = (clientY ?? window.innerHeight / 2) + 8;
  left = Math.min(left, window.innerWidth - w - margin);
  top = Math.min(top, window.innerHeight - h - margin);
  left = Math.max(margin, left);
  top = Math.max(margin, top);
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;

  openPopoverEl = popover;
  setTimeout(() => document.addEventListener('click', onNodeViewOutsideClick), 0);
}

function closeNodeView() {
  el.nodeViewPopover.hidden = true;
  if (openPopoverEl === el.nodeViewPopover) openPopoverEl = null;
  nodeViewState = null;
  document.removeEventListener('click', onNodeViewOutsideClick);
}

function onNodeViewOutsideClick(e) {
  if (!el.nodeViewPopover.contains(e.target)) closeNodeView();
}

el.nodeViewEdit.addEventListener('click', () => {
  const node = nodeViewState && nodeViewState.node;
  closeNodeView();
  if (node) editNode(node);
});

// --- Node form popover ---

let nodeFormState = null;

function openNodeForm({ clientX, clientY, initial, onSubmit, lockTitle }) {
  closeAllPopovers();
  resetMarkdownTabs('node-form');
  nodeFormState = { onSubmit };
  el.nodeFormTitle.value = initial.label || '';
  el.nodeFormDesc.value = initial.description || '';
  el.nodeFormTitle.readOnly = !!lockTitle;
  el.nodeFormTitle.classList.toggle('locked', !!lockTitle);
  el.nodeFormTitleHint.hidden = !lockTitle;
  hideContextMenu();

  const popover = el.nodeFormPopover;
  popover.hidden = false;
  const popW = 290;
  const popH = popover.offsetHeight || 220;
  const margin = 12;
  let left = (clientX ?? window.innerWidth / 2) + 8;
  let top = (clientY ?? window.innerHeight / 2) + 8;
  left = Math.min(left, window.innerWidth - popW - margin);
  top = Math.min(top, window.innerHeight - popH - margin);
  left = Math.max(margin, left);
  top = Math.max(margin, top);
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;

  requestAnimationFrame(() => (lockTitle ? el.nodeFormDesc : el.nodeFormTitle).focus());
  setTimeout(() => document.addEventListener('click', onNodeFormOutsideClick), 0);
}

function onNodeFormOutsideClick(e) {
  if (!el.nodeFormPopover.contains(e.target)) closeNodeForm();
}

function closeNodeForm() {
  el.nodeFormPopover.hidden = true;
  nodeFormState = null;
  el.nodeForm.reset();
  el.nodeFormTitle.readOnly = false;
  el.nodeFormTitle.classList.remove('locked');
  el.nodeFormTitleHint.hidden = true;
  document.removeEventListener('click', onNodeFormOutsideClick);
}

el.nodeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!nodeFormState) return;
  const label = el.nodeFormTitle.value.trim();
  if (!label) return;
  const description = el.nodeFormDesc.value.trim();
  const { onSubmit } = nodeFormState;
  closeNodeForm();
  onSubmit({ label, description });
});

el.nodeFormCancel.addEventListener('click', () => closeNodeForm());

function removeNode(nodeId) {
  state.graph.nodes = state.graph.nodes.filter((n) => n.id !== nodeId);
  state.graph.edges = state.graph.edges.filter((e) => e.from !== nodeId && e.to !== nodeId);
  state.multiSelected.delete(nodeId);
}

function removeEdge(edgeId) {
  state.graph.edges = state.graph.edges.filter((e) => e.id !== edgeId);
}

function toggleDone(nodeId) {
  const node = state.graph.nodes.find((n) => n.id === nodeId);
  if (node) node.done = !node.done;
}

function updateLinkModeUI() {
  el.linkModeBtn.classList.toggle('active', state.mode === 'link');
  el.linkHint.hidden = state.mode !== 'link';
}

async function saveGraph() {
  await api(`/api/tickets/${state.currentTicketId}/graph`, {
    method: 'PUT',
    body: JSON.stringify(state.graph),
  });
}

el.addNodeBtn.addEventListener('click', () => {
  const rect = el.svg.getBoundingClientRect();
  const x = rect.width / 2 + (Math.random() * 60 - 30);
  const y = rect.height / 2 + (Math.random() * 60 - 30);
  const btnRect = el.addNodeBtn.getBoundingClientRect();
  addNodeAt(x, y, btnRect.left, btnRect.bottom + 6);
});

el.linkModeBtn.addEventListener('click', () => {
  state.mode = state.mode === 'link' ? 'idle' : 'link';
  state.linkFirst = null;
  updateLinkModeUI();
});

function startLinkFrom(node) {
  state.mode = 'link';
  state.linkFirst = node.id;
  updateLinkModeUI();
  renderGraph();
}

// --- Start / End marker nodes ---

function addSpecialNode(nodeType) {
  const existing = state.graph.nodes.find((n) => n.nodeType === nodeType);
  if (existing) {
    state.selected = { type: 'node', id: existing.id };
    renderGraph();
    return;
  }
  const rect = el.svg.getBoundingClientRect();
  const otherType = nodeType === 'start' ? 'end' : 'start';
  const other = state.graph.nodes.find((n) => n.nodeType === otherType);
  let x;
  if (other) {
    x = nodeType === 'start' ? Math.max(80, other.x - 260) : other.x + 260;
  } else {
    x = nodeType === 'start' ? 90 : rect.width - 90;
  }
  const y = rect.height / 2;
  const node = {
    id: genId(),
    label: nodeType === 'start' ? 'Inizio' : 'Fine',
    description: '',
    done: false,
    nodeType,
    x,
    y,
  };
  state.graph.nodes.push(node);
  state.selected = { type: 'node', id: node.id };
  renderGraph();
  saveGraph();
}

el.startNodeBtn.addEventListener('click', () => addSpecialNode('start'));
el.endNodeBtn.addEventListener('click', () => addSpecialNode('end'));

el.deleteSelectionBtn.addEventListener('click', () => {
  if (state.multiSelected.size > 0) {
    for (const id of state.multiSelected) removeNode(id);
    state.multiSelected.clear();
    renderGraph();
    saveGraph();
    return;
  }
  if (!state.selected) return;
  if (state.selected.type === 'node') removeNode(state.selected.id);
  else removeEdge(state.selected.id);
  state.selected = null;
  renderGraph();
  saveGraph();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    state.mode = 'idle';
    state.linkFirst = null;
    state.multiSelected.clear();
    updateLinkModeUI();
    renderGraph();
    closeAllPopovers();
    hideContextMenu();
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if ((state.selected || state.multiSelected.size > 0) && document.activeElement === document.body) {
      el.deleteSelectionBtn.click();
    }
  }
});

let marqueeState = null;
let suppressNextCanvasClick = false;

el.svg.addEventListener('mousedown', (e) => {
  // Avoid the native text-selection cursor/highlight that a double-click on the canvas can trigger.
  if (e.detail > 1) e.preventDefault();

  if (e.button !== 0 || state.mode === 'link' || e.target !== el.svg) return;
  const rect = el.svg.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  marqueeState = { startX: x, startY: y, curX: x, curY: y, moved: false };
});

el.svg.addEventListener('dblclick', (e) => {
  e.preventDefault();
  if (e.target === el.svg) {
    const rect = el.svg.getBoundingClientRect();
    addNodeAt(e.clientX - rect.left, e.clientY - rect.top, e.clientX, e.clientY);
  }
});

el.svg.addEventListener('click', (e) => {
  if (suppressNextCanvasClick) {
    suppressNextCanvasClick = false;
    return;
  }
  if (e.target === el.svg) {
    state.selected = null;
    state.multiSelected.clear();
    renderGraph();
  }
});

// --- Context menu ---

function showContextMenu(clientX, clientY, items) {
  const menu = el.contextMenu;
  menu.innerHTML = '';
  for (const item of items) {
    if (item === 'separator') {
      menu.appendChild(document.createElement('hr'));
      continue;
    }
    const btn = document.createElement('button');
    btn.innerHTML = (item.icon ? svgIcon(item.icon, 14) : '') + `<span>${item.label}</span>`;
    if (item.danger) btn.classList.add('danger');
    btn.addEventListener('click', () => {
      hideContextMenu();
      item.action();
    });
    menu.appendChild(btn);
  }
  const margin = 8;
  menu.hidden = false;
  const w = menu.offsetWidth || 200;
  const h = menu.offsetHeight || 150;
  menu.style.left = `${Math.min(clientX, window.innerWidth - w - margin)}px`;
  menu.style.top = `${Math.min(clientY, window.innerHeight - h - margin)}px`;
}

function hideContextMenu() {
  el.contextMenu.hidden = true;
}

document.addEventListener('click', (e) => {
  if (!el.contextMenu.hidden && !el.contextMenu.contains(e.target)) hideContextMenu();
});
document.addEventListener('contextmenu', (e) => {
  if (!el.contextMenu.contains(e.target) && !el.svg.contains(e.target)) hideContextMenu();
});

function onNodeContextMenu(node, e) {
  e.preventDefault();
  e.stopPropagation();
  state.selected = { type: 'node', id: node.id };
  state.multiSelected.clear();
  renderGraph();
  showContextMenu(e.clientX, e.clientY, [
    { label: 'Aggiungi nodo collegato', icon: 'plus', action: () => addConnectedNode(node, e.clientX, e.clientY) },
    { label: 'Collega a un nodo esistente', icon: 'link', action: () => startLinkFrom(node) },
    { label: 'Modifica', icon: 'pencil', action: () => editNode(node, e.clientX, e.clientY) },
    {
      label: node.done ? 'Segna come da fare' : 'Segna come completato',
      icon: 'check',
      action: () => {
        toggleDone(node.id);
        renderGraph();
        saveGraph();
      },
    },
    'separator',
    {
      label: 'Elimina nodo',
      icon: 'trash',
      danger: true,
      action: () => {
        removeNode(node.id);
        state.selected = null;
        renderGraph();
        saveGraph();
      },
    },
  ]);
}

function onEdgeContextMenu(edge, e) {
  e.preventDefault();
  e.stopPropagation();
  state.selected = { type: 'edge', id: edge.id };
  state.multiSelected.clear();
  renderGraph();
  showContextMenu(e.clientX, e.clientY, [
    {
      label: 'Elimina collegamento',
      icon: 'trash',
      danger: true,
      action: () => {
        removeEdge(edge.id);
        state.selected = null;
        renderGraph();
        saveGraph();
      },
    },
  ]);
}

el.svg.addEventListener('contextmenu', (e) => {
  if (e.target !== el.svg) return;
  e.preventDefault();
  const rect = el.svg.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const hasStart = state.graph.nodes.some((n) => n.nodeType === 'start');
  const hasEnd = state.graph.nodes.some((n) => n.nodeType === 'end');
  showContextMenu(e.clientX, e.clientY, [
    { label: 'Aggiungi nodo qui', icon: 'plus', action: () => addNodeAt(x, y, e.clientX, e.clientY) },
    'separator',
    { label: hasStart ? 'Vai al nodo di inizio' : 'Aggiungi nodo di inizio', icon: 'play', action: () => addSpecialNode('start') },
    { label: hasEnd ? 'Vai al nodo di fine' : 'Aggiungi nodo di fine', icon: 'flag', action: () => addSpecialNode('end') },
  ]);
});

function onNodeClick(node) {
  if (state.mode === 'link') {
    if (!state.linkFirst) {
      state.linkFirst = node.id;
    } else if (state.linkFirst !== node.id) {
      const exists = state.graph.edges.some(
        (edge) => edge.from === state.linkFirst && edge.to === node.id
      );
      if (!exists) {
        state.graph.edges.push({ id: genId(), from: state.linkFirst, to: node.id });
        saveGraph();
      }
      state.linkFirst = null;
      state.mode = 'idle';
      updateLinkModeUI();
    }
    renderGraph();
    return;
  }
  toggleDone(node.id);
  renderGraph();
  saveGraph();
}

function onEdgeClick(edge) {
  if (state.mode === 'link') return;
  state.selected = { type: 'edge', id: edge.id };
  state.multiSelected.clear();
  renderGraph();
}

let dragState = null;
let groupDragState = null;
let suppressNextClick = false;

function onNodeMouseDown(node, e) {
  if (state.mode === 'link') return;
  if (e.detail > 1) e.preventDefault();
  e.stopPropagation(); // don't let this bubble into the marquee-selection mousedown handler

  if (state.multiSelected.size > 1 && state.multiSelected.has(node.id)) {
    const starts = new Map();
    for (const id of state.multiSelected) {
      const n = state.graph.nodes.find((gn) => gn.id === id);
      if (n) starts.set(id, { x: n.x, y: n.y });
    }
    groupDragState = { startClientX: e.clientX, startClientY: e.clientY, starts, moved: false };
    return;
  }

  if (state.multiSelected.size > 0) {
    state.multiSelected.clear();
    renderGraph();
  }
  const rect = el.svg.getBoundingClientRect();
  dragState = {
    nodeId: node.id,
    offsetX: e.clientX - rect.left - node.x,
    offsetY: e.clientY - rect.top - node.y,
    moved: false,
  };
}

const GRID_SIZE = 24;

function snapToGrid(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function nodesOverlapRect(node, rx1, ry1, rx2, ry2) {
  const w = nodeWidth() / 2;
  const h = NODE_HEIGHT / 2;
  return node.x - w < rx2 && node.x + w > rx1 && node.y - h < ry2 && node.y + h > ry1;
}

function updateMarqueeRect() {
  if (!marqueeState) return;
  let rectEl = el.svg.querySelector('#marquee-rect');
  if (!rectEl) {
    rectEl = document.createElementNS(SVG_NS, 'rect');
    rectEl.setAttribute('id', 'marquee-rect');
    rectEl.setAttribute('class', 'marquee-rect');
    el.svg.appendChild(rectEl);
  } else {
    el.svg.appendChild(rectEl); // keep it on top after a renderGraph() rebuild
  }
  const x = Math.min(marqueeState.startX, marqueeState.curX);
  const y = Math.min(marqueeState.startY, marqueeState.curY);
  const w = Math.abs(marqueeState.curX - marqueeState.startX);
  const h = Math.abs(marqueeState.curY - marqueeState.startY);
  rectEl.setAttribute('x', x);
  rectEl.setAttribute('y', y);
  rectEl.setAttribute('width', w);
  rectEl.setAttribute('height', h);
}

el.svg.addEventListener('mousemove', (e) => {
  if (marqueeState) {
    const rect = el.svg.getBoundingClientRect();
    marqueeState.curX = e.clientX - rect.left;
    marqueeState.curY = e.clientY - rect.top;
    if (
      Math.abs(marqueeState.curX - marqueeState.startX) > 3 ||
      Math.abs(marqueeState.curY - marqueeState.startY) > 3
    ) {
      marqueeState.moved = true;
    }
    if (marqueeState.moved) {
      const rx1 = Math.min(marqueeState.startX, marqueeState.curX);
      const rx2 = Math.max(marqueeState.startX, marqueeState.curX);
      const ry1 = Math.min(marqueeState.startY, marqueeState.curY);
      const ry2 = Math.max(marqueeState.startY, marqueeState.curY);
      state.multiSelected = new Set(
        state.graph.nodes.filter((n) => nodesOverlapRect(n, rx1, ry1, rx2, ry2)).map((n) => n.id)
      );
      state.selected = null;
      renderGraph();
      updateMarqueeRect();
    }
    return;
  }

  if (groupDragState) {
    let dx = e.clientX - groupDragState.startClientX;
    let dy = e.clientY - groupDragState.startClientY;
    if (e.ctrlKey || e.metaKey) {
      dx = snapToGrid(dx);
      dy = snapToGrid(dy);
    }
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) groupDragState.moved = true;
    for (const [id, start] of groupDragState.starts) {
      const n = state.graph.nodes.find((gn) => gn.id === id);
      if (n) {
        n.x = start.x + dx;
        n.y = start.y + dy;
      }
    }
    renderGraph();
    return;
  }

  if (!dragState) return;
  const rect = el.svg.getBoundingClientRect();
  const node = state.graph.nodes.find((n) => n.id === dragState.nodeId);
  if (!node) return;
  let newX = e.clientX - rect.left - dragState.offsetX;
  let newY = e.clientY - rect.top - dragState.offsetY;
  if (e.ctrlKey || e.metaKey) {
    newX = snapToGrid(newX);
    newY = snapToGrid(newY);
  }
  if (Math.abs(newX - node.x) > 2 || Math.abs(newY - node.y) > 2) dragState.moved = true;
  node.x = newX;
  node.y = newY;
  renderGraph();
});

el.svg.addEventListener('mouseup', () => {
  if (marqueeState) {
    if (marqueeState.moved) suppressNextCanvasClick = true;
    marqueeState = null;
    const stray = el.svg.querySelector('#marquee-rect');
    if (stray) stray.remove();
    return;
  }
  if (groupDragState) {
    if (groupDragState.moved) {
      suppressNextClick = true;
      saveGraph();
    }
    groupDragState = null;
    return;
  }
  if (dragState) {
    if (dragState.moved) {
      suppressNextClick = true;
      saveGraph();
    }
    dragState = null;
  }
});

el.svg.addEventListener('mouseleave', () => {
  if (marqueeState) {
    marqueeState = null;
    const stray = el.svg.querySelector('#marquee-rect');
    if (stray) stray.remove();
  }
  if (groupDragState) {
    if (groupDragState.moved) saveGraph();
    groupDragState = null;
  }
  if (dragState) {
    if (dragState.moved) saveGraph();
    dragState = null;
  }
});

function rectBorderPoint(node, towardX, towardY) {
  const w = nodeWidth(node) / 2;
  const h = NODE_HEIGHT / 2;
  const dx = towardX - node.x;
  const dy = towardY - node.y;
  if (dx === 0 && dy === 0) return { x: node.x, y: node.y };
  const scale = 1 / Math.max(Math.abs(dx) / w, Math.abs(dy) / h);
  return { x: node.x + dx * scale, y: node.y + dy * scale };
}

function svgIconGroup(name, cx, cy, size, className) {
  const g = document.createElementNS(SVG_NS, 'g');
  if (className) g.setAttribute('class', className);
  g.setAttribute('fill', 'none');
  g.setAttribute('stroke', 'currentColor');
  g.setAttribute('stroke-width', '2');
  g.setAttribute('stroke-linecap', 'round');
  g.setAttribute('stroke-linejoin', 'round');
  g.setAttribute('transform', `translate(${cx - size / 2}, ${cy - size / 2}) scale(${size / 24})`);
  g.innerHTML = ICONS[name] || '';
  return g;
}

function renderGraph() {
  el.svg.innerHTML = '';

  let defs = document.createElementNS(SVG_NS, 'defs');
  defs.innerHTML = `
    <marker id="arrowhead" markerWidth="9" markerHeight="9" refX="7.6" refY="4.5" orient="auto"
      markerUnits="userSpaceOnUse">
      <path d="M0,0.6 L9,4.5 L0,8.4 Z" class="edge-arrow" />
    </marker>
  `;
  el.svg.appendChild(defs);

  if (state.graph.nodes.length === 0) {
    const hint = document.createElementNS(SVG_NS, 'text');
    hint.setAttribute('x', '50%');
    hint.setAttribute('y', '50%');
    hint.setAttribute('class', 'empty-graph-hint');
    hint.textContent = 'Nessun passaggio ancora — clicca "+ Nodo" o fai doppio click qui per iniziare';
    hint.style.pointerEvents = 'none';
    el.svg.appendChild(hint);
  }

  for (const edge of state.graph.edges) {
    const from = state.graph.nodes.find((n) => n.id === edge.from);
    const to = state.graph.nodes.find((n) => n.id === edge.to);
    if (!from || !to) continue;
    const start = rectBorderPoint(from, to.x, to.y);
    const end = rectBorderPoint(to, from.x, from.y);
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', start.x);
    line.setAttribute('y1', start.y);
    line.setAttribute('x2', end.x);
    line.setAttribute('y2', end.y);
    line.setAttribute('class', 'edge-line' + (isSelected('edge', edge.id) ? ' selected' : ''));
    line.setAttribute('marker-end', 'url(#arrowhead)');
    line.addEventListener('click', (e) => {
      e.stopPropagation();
      onEdgeClick(edge);
    });
    line.addEventListener('contextmenu', (e) => onEdgeContextMenu(edge, e));
    el.svg.appendChild(line);
  }

  for (const node of state.graph.nodes) {
    const group = document.createElementNS(SVG_NS, 'g');
    const w = nodeWidth(node);

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', node.x - w / 2);
    rect.setAttribute('y', node.y - NODE_HEIGHT / 2);
    rect.setAttribute('width', w);
    rect.setAttribute('height', NODE_HEIGHT);
    rect.setAttribute('rx', NODE_RX);
    rect.setAttribute('ry', NODE_RX);
    let cls = 'node-rect';
    if (node.nodeType) cls += ` ${node.nodeType}`;
    if (node.done) cls += ' done';
    if (isSelected('node', node.id) || state.linkFirst === node.id) cls += ' selected';
    if (state.multiSelected.has(node.id)) cls += ' multi-selected';
    rect.setAttribute('class', cls);
    rect.addEventListener('mousedown', (e) => onNodeMouseDown(node, e));
    rect.addEventListener('click', (e) => {
      e.stopPropagation();
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }
      onNodeClick(node);
    });
    rect.addEventListener('contextmenu', (e) => onNodeContextMenu(node, e));
    if (node.label.length > NODE_LABEL_MAX_CHARS) {
      const titleEl = document.createElementNS(SVG_NS, 'title');
      titleEl.textContent = node.label;
      rect.appendChild(titleEl);
    }
    group.appendChild(rect);

    const badgeKind = node.nodeType || null;
    if (badgeKind) {
      const badgeCx = node.x - w / 2 + 22;
      const badge = document.createElementNS(SVG_NS, 'g');
      badge.setAttribute('class', `node-badge ${badgeKind}`);
      badge.style.pointerEvents = 'none';
      const badgeCircle = document.createElementNS(SVG_NS, 'circle');
      badgeCircle.setAttribute('cx', badgeCx);
      badgeCircle.setAttribute('cy', node.y);
      badgeCircle.setAttribute('r', 10);
      badge.appendChild(badgeCircle);
      const badgeIconName = badgeKind === 'start' ? 'play' : 'flag';
      const badgeIcon = svgIconGroup(badgeIconName, badgeCx, node.y, 12, 'node-badge-icon');
      if (badgeIconName === 'play') {
        badgeIcon.setAttribute('fill', 'currentColor');
        badgeIcon.setAttribute('stroke', 'none');
      }
      badge.appendChild(badgeIcon);
      group.appendChild(badge);
    }

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', node.x + (badgeKind ? 12 : 0));
    text.setAttribute('y', node.y);
    text.setAttribute(
      'class',
      'node-label' + (node.done ? ' done' : '') + (node.nodeType ? ' locked' : '')
    );
    text.textContent = truncateLabel(node.label);
    text.style.pointerEvents = 'none';
    group.appendChild(text);

    // Info button: click to view/edit description
    const infoCx = node.x + w / 2 - 16;
    const infoCy = node.y - NODE_HEIGHT / 2 + 14;
    const infoGroup = document.createElementNS(SVG_NS, 'g');
    infoGroup.setAttribute('class', 'node-info-btn');
    const infoCircle = document.createElementNS(SVG_NS, 'circle');
    infoCircle.setAttribute('cx', infoCx);
    infoCircle.setAttribute('cy', infoCy);
    infoCircle.setAttribute('r', 9);
    infoGroup.appendChild(infoCircle);
    const infoIcon = svgIconGroup('info', infoCx, infoCy, 11, '');
    infoGroup.appendChild(infoIcon);
    if (node.description) {
      const titleEl = document.createElementNS(SVG_NS, 'title');
      titleEl.textContent = node.description;
      infoGroup.appendChild(titleEl);
    }
    infoGroup.addEventListener('mousedown', (e) => e.stopPropagation());
    infoGroup.addEventListener('click', (e) => {
      e.stopPropagation();
      viewNodeDescription(node, e.clientX, e.clientY);
    });
    group.appendChild(infoGroup);

    el.svg.appendChild(group);
  }
}

function isSelected(type, id) {
  return state.selected && state.selected.type === type && state.selected.id === id;
}

// --- Auth bootstrap ---

function showLoginScreen(githubLoginEnabled) {
  el.appRoot.hidden = true;
  el.loginScreen.hidden = false;
  const enabled = githubLoginEnabled !== false;
  el.githubLoginBtn.hidden = !enabled;
  el.loginConfigHint.hidden = enabled;
}

function showApp(user) {
  el.loginScreen.hidden = true;
  el.appRoot.hidden = false;
  el.userName.textContent = user.username;
  if (user.avatarUrl) {
    el.userAvatar.src = user.avatarUrl;
    el.userAvatar.hidden = false;
    el.userAvatarFallback.hidden = true;
  } else {
    el.userAvatarFallback.textContent = user.username.slice(0, 2);
    el.userAvatarFallback.hidden = false;
    el.userAvatar.hidden = true;
  }
}

el.localLoginBtn.addEventListener('click', () => {
  window.location.href = '/auth/local';
});

el.logoutBtn.addEventListener('click', async () => {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.reload();
});

async function bootstrap() {
  const meRes = await fetch('/api/me');
  if (meRes.ok) {
    const user = await meRes.json();
    showApp(user);
    loadAll();
    return;
  }
  const configRes = await fetch('/api/config');
  const config = configRes.ok ? await configRes.json() : { githubLoginEnabled: false };
  showLoginScreen(config.githubLoginEnabled);
}

bootstrap();
