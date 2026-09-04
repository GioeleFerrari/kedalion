const COLLAPSED_FOLDERS_STORAGE_KEY = 'kedalion-collapsed-folders';

function loadCollapsedFolders() {
  try {
    const raw = localStorage.getItem(COLLAPSED_FOLDERS_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
}

function saveCollapsedFolders() {
  try {
    localStorage.setItem(COLLAPSED_FOLDERS_STORAGE_KEY, JSON.stringify([...state.collapsedFolders]));
  } catch (e) {
    // Storage may be unavailable; the state still applies for this session.
  }
}

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
  searchNodeMatchIds: new Set(), // ticket ids matched by node label/description, filled in async by /api/search
  allTags: [], // every distinct tag used across the user's tickets, for the filter list
  activeTags: new Set(), // tags currently used to filter the ticket tree (a ticket must have all of them)
  collapsedFolders: loadCollapsedFolders(),
  pan: { x: 0, y: 0 }, // canvas viewport offset, lets a graph wider than the screen be scrolled/panned
  zoom: 1,
};

const el = {
  ticketTree: document.getElementById('ticket-tree'),
  newTicketBtn: document.getElementById('new-ticket-btn'),
  searchBtn: document.getElementById('search-btn'),
  newFolderBtn: document.getElementById('new-folder-btn'),
  searchBox: document.getElementById('search-box'),
  searchInput: document.getElementById('search-input'),
  tagsBtn: document.getElementById('tags-btn'),
  tagFilterBox: document.getElementById('tag-filter-box'),
  tagFilterList: document.getElementById('tag-filter-list'),
  tagFilterEmpty: document.getElementById('tag-filter-empty'),
  brandIcon: document.getElementById('brand-icon'),
  emptyState: document.getElementById('empty-state'),
  emptyIcon: document.getElementById('empty-icon'),
  ticketView: document.getElementById('ticket-view'),
  ticketTitle: document.getElementById('ticket-title'),
  ticketEditBtn: document.getElementById('ticket-edit-btn'),
  ticketDesc: document.getElementById('ticket-desc'),
  ticketDescEmpty: document.getElementById('ticket-desc-empty'),
  ticketTags: document.getElementById('ticket-tags'),
  svg: document.getElementById('graph-svg'),
  addNodeMenuBtn: document.getElementById('add-node-menu-btn'),
  linkModeBtn: document.getElementById('link-mode-btn'),
  centerViewBtn: document.getElementById('center-view-btn'),
  autoLayoutBtn: document.getElementById('auto-layout-btn'),
  undoBtn: document.getElementById('undo-btn'),
  redoBtn: document.getElementById('redo-btn'),
  deleteSelectionBtn: document.getElementById('delete-selection-btn'),
  linkHint: document.getElementById('link-hint'),
  contextMenu: document.getElementById('context-menu'),

  nodeFormPopover: document.getElementById('node-form-popover'),
  nodeFormHeaderIcon: document.getElementById('node-form-header-icon'),
  nodeFormHeaderTitle: document.getElementById('node-form-header-title'),
  nodeFormClose: document.getElementById('node-form-close'),
  nodeForm: document.getElementById('node-form'),
  nodeFormTitle: document.getElementById('node-form-title'),
  nodeFormTitleHint: document.getElementById('node-form-title-hint'),
  nodeFormDesc: document.getElementById('node-form-desc'),
  nodeFormCancel: document.getElementById('node-form-cancel'),

  nodeViewPopover: document.getElementById('node-view-popover'),
  nodeViewHeaderIcon: document.getElementById('node-view-header-icon'),
  nodeViewTitle: document.getElementById('node-view-title'),
  nodeViewDesc: document.getElementById('node-view-desc'),
  nodeViewEmpty: document.getElementById('node-view-empty'),
  nodeViewEdit: document.getElementById('node-view-edit'),
  nodeViewClose: document.getElementById('node-view-close'),

  ticketFormPopover: document.getElementById('ticket-form-popover'),
  ticketFormHeaderIcon: document.getElementById('ticket-form-header-icon'),
  ticketFormHeaderTitle: document.getElementById('ticket-form-header-title'),
  ticketFormClose: document.getElementById('ticket-form-close'),
  ticketForm: document.getElementById('ticket-form'),
  ticketFormTitle: document.getElementById('ticket-form-title'),
  ticketFormDesc: document.getElementById('ticket-form-desc'),
  ticketFormFolder: document.getElementById('ticket-form-folder'),
  ticketFormTags: document.getElementById('ticket-form-tags'),
  ticketFormTagsInput: document.getElementById('ticket-form-tags-input'),
  ticketFormSubmit: document.getElementById('ticket-form-submit'),
  ticketFormCancel: document.getElementById('ticket-form-cancel'),

  edgeLabelPopover: document.getElementById('edge-label-popover'),
  edgeLabelHeaderIcon: document.getElementById('edge-label-header-icon'),
  edgeLabelForm: document.getElementById('edge-label-form'),
  edgeLabelInput: document.getElementById('edge-label-input'),
  edgeLabelClose: document.getElementById('edge-label-close'),
  edgeLabelCancel: document.getElementById('edge-label-cancel'),

  folderFormPopover: document.getElementById('folder-form-popover'),
  folderFormHeaderIcon: document.getElementById('folder-form-header-icon'),
  folderFormHeaderTitle: document.getElementById('folder-form-header-title'),
  folderFormClose: document.getElementById('folder-form-close'),
  folderForm: document.getElementById('folder-form'),
  folderFormName: document.getElementById('folder-form-name'),
  folderFormSubmit: document.getElementById('folder-form-submit'),
  folderFormCancel: document.getElementById('folder-form-cancel'),

  loginScreen: document.getElementById('login-screen'),
  appRoot: document.getElementById('app-root'),
  loginBrandIcon: document.getElementById('login-brand-icon'),
  loginFeatureIcon1: document.getElementById('login-feature-icon-1'),
  loginFeatureIcon2: document.getElementById('login-feature-icon-2'),
  loginFeatureIcon3: document.getElementById('login-feature-icon-3'),
  githubLoginBtn: document.getElementById('github-login-btn'),
  githubLoginIcon: document.getElementById('github-login-icon'),
  localLoginBtn: document.getElementById('local-login-btn'),
  loginConfigHint: document.getElementById('login-config-hint'),
  userAvatar: document.getElementById('user-avatar'),
  userAvatarFallback: document.getElementById('user-avatar-fallback'),
  userName: document.getElementById('user-name'),
  logoutBtn: document.getElementById('logout-btn'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  sidebar: document.getElementById('sidebar'),
  sidebarCollapseBtn: document.getElementById('sidebar-collapse-btn'),
  sidebarExpandBtn: document.getElementById('sidebar-expand-btn'),

  importBtn: document.getElementById('import-btn'),
  importFileInput: document.getElementById('import-file-input'),
  exportTicketBtn: document.getElementById('export-ticket-btn'),

  toast: document.getElementById('toast'),
  toastIcon: document.getElementById('toast-icon'),
  toastMessage: document.getElementById('toast-message'),

  cmdkOverlay: document.getElementById('cmdk-overlay'),
  cmdkInput: document.getElementById('cmdk-input'),
  cmdkList: document.getElementById('cmdk-list'),
  cmdkEmpty: document.getElementById('cmdk-empty'),
  cmdkSearchIcon: document.getElementById('cmdk-search-icon'),

  confirmOverlay: document.getElementById('confirm-overlay'),
  confirmIcon: document.getElementById('confirm-icon'),
  confirmTitle: document.getElementById('confirm-title'),
  confirmMessage: document.getElementById('confirm-message'),
  confirmCancel: document.getElementById('confirm-cancel'),
  confirmOk: document.getElementById('confirm-ok'),
};

let toastTimer = null;
const TOAST_ICONS = { success: 'check', error: 'alertTriangle' };

function showToast(message, kind) {
  clearTimeout(toastTimer);
  el.toastMessage.textContent = message;
  el.toastIcon.innerHTML = svgIcon(TOAST_ICONS[kind] || 'info', 13);
  el.toast.className = 'toast' + (kind ? ` ${kind}` : '');
  el.toast.hidden = false;
  toastTimer = setTimeout(() => {
    el.toast.hidden = true;
  }, 3200);
}

// --- Custom confirm dialog (replaces window.confirm) ---

el.confirmIcon.innerHTML = svgIcon('alertTriangle', 22);

let confirmResolver = null;

function askConfirm({ title, message, confirmLabel = 'Elimina' }) {
  el.confirmTitle.textContent = title;
  el.confirmMessage.textContent = message;
  el.confirmOk.textContent = confirmLabel;
  el.confirmOverlay.hidden = false;
  requestAnimationFrame(() => el.confirmCancel.focus());
  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function closeConfirm(result) {
  el.confirmOverlay.hidden = true;
  if (confirmResolver) {
    const resolve = confirmResolver;
    confirmResolver = null;
    resolve(result);
  }
}

el.confirmCancel.addEventListener('click', () => closeConfirm(false));
el.confirmOk.addEventListener('click', () => closeConfirm(true));
el.confirmOverlay.addEventListener('click', (e) => {
  if (e.target === el.confirmOverlay) closeConfirm(false);
});

const NODE_HEIGHT = 48;
const NODE_WIDTH = 170;
const NODE_RX = 10;
const NODE_LABEL_MAX_CHARS = 20;
const SVG_NS = 'http://www.w3.org/2000/svg';

function nodeWidth() {
  return NODE_WIDTH;
}

// Converts a mouse event's viewport coordinates into graph space (i.e. undoes the
// current pan/zoom), since the canvas can be scrolled and zoomed independently of
// the nodes' own coordinates.
function clientToGraph(clientX, clientY) {
  const rect = el.svg.getBoundingClientRect();
  return {
    x: (clientX - rect.left - state.pan.x) / state.zoom,
    y: (clientY - rect.top - state.pan.y) / state.zoom,
  };
}

function viewCenterGraphPoint() {
  const rect = el.svg.getBoundingClientRect();
  return clientToGraph(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;

// Pans (and resets zoom) so the whole graph is centered and fully visible in the canvas.
function centerGraphView() {
  const rect = el.svg.getBoundingClientRect();
  const nodes = state.graph.nodes;
  state.zoom = 1;
  if (nodes.length === 0) {
    state.pan = { x: 0, y: 0 };
    return;
  }
  const minX = Math.min(...nodes.map((n) => n.x - nodeWidth() / 2));
  const maxX = Math.max(...nodes.map((n) => n.x + nodeWidth() / 2));
  const minY = Math.min(...nodes.map((n) => n.y - NODE_HEIGHT / 2));
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_HEIGHT / 2));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  state.pan = { x: rect.width / 2 - centerX, y: rect.height / 2 - centerY };
}

// Rearranges nodes into clean left-to-right levels (a simple layered/Sugiyama-style
// layout): each node's level is the longest path from a root (the Start node if
// present, otherwise any node with no incoming edge), nodes in the same level are
// stacked vertically in their current top-to-bottom order, and any node the graph
// walk never reaches (disconnected fragments) is placed in one extra level after
// the rest so nothing is lost or overlapped.
function autoLayoutGraph() {
  const nodes = state.graph.nodes;
  if (nodes.length === 0) return;
  const edges = state.graph.edges;
  const nodeIds = new Set(nodes.map((n) => n.id));
  const outgoing = new Map(nodes.map((n) => [n.id, []]));
  const incomingCount = new Map(nodes.map((n) => [n.id, 0]));
  for (const e of edges) {
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue;
    outgoing.get(e.from).push(e.to);
    incomingCount.set(e.to, incomingCount.get(e.to) + 1);
  }

  const startNode = nodes.find((n) => n.nodeType === 'start');
  const roots = [];
  if (startNode) roots.push(startNode.id);
  for (const n of nodes) {
    if (n.id !== (startNode && startNode.id) && incomingCount.get(n.id) === 0) roots.push(n.id);
  }

  // Longest-path level assignment via relaxation (safe against cycles: a node is
  // only re-queued when a strictly longer path to it is found, so it terminates).
  const levels = new Map(roots.map((id) => [id, 0]));
  const queue = [...roots];
  let guard = 0;
  while (queue.length > 0 && guard < nodes.length * nodes.length + nodes.length) {
    guard++;
    const id = queue.shift();
    const lvl = levels.get(id);
    for (const toId of outgoing.get(id) || []) {
      const candidate = lvl + 1;
      if (!levels.has(toId) || levels.get(toId) < candidate) {
        levels.set(toId, candidate);
        queue.push(toId);
      }
    }
  }
  const maxAssignedLevel = Math.max(0, ...levels.values());
  for (const n of nodes) {
    if (!levels.has(n.id)) levels.set(n.id, maxAssignedLevel + 1); // unreached: own trailing level
  }

  const byLevel = new Map();
  for (const n of nodes) {
    const lvl = levels.get(n.id);
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl).push(n);
  }

  const H_GAP = NODE_WIDTH + 90;
  const V_GAP = NODE_HEIGHT + 40;
  for (const [lvl, group] of byLevel) {
    group.sort((a, b) => a.y - b.y);
    const totalHeight = (group.length - 1) * V_GAP;
    group.forEach((n, i) => {
      n.x = lvl * H_GAP;
      n.y = i * V_GAP - totalHeight / 2;
    });
  }
}

el.autoLayoutBtn.addEventListener('click', () => {
  pushUndo();
  autoLayoutGraph();
  centerGraphView();
  renderGraph();
  saveGraph();
});

function graphTransformString() {
  return `translate(${state.pan.x}, ${state.pan.y}) scale(${state.zoom})`;
}

// Cheap panning/zooming update: just move the existing group instead of rebuilding
// the whole graph (nodes/edges/listeners) on every wheel tick or pan-drag frame.
function applyPanTransform() {
  const viewport = el.svg.querySelector('.graph-viewport');
  if (viewport) viewport.setAttribute('transform', graphTransformString());
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
el.tagsBtn.innerHTML = svgIcon('tag', 16);
el.newFolderBtn.innerHTML = svgIcon('folderPlus', 16);
el.importBtn.innerHTML = svgIcon('upload', 16);
el.nodeViewEdit.innerHTML = svgIcon('pencil', 13);
el.ticketEditBtn.innerHTML = svgIcon('pencil', 13);
el.undoBtn.innerHTML = svgIcon('undo', 15);
el.redoBtn.innerHTML = svgIcon('redo', 15);
el.cmdkSearchIcon.innerHTML = svgIcon('search', 15);
el.nodeViewClose.innerHTML = svgIcon('x', 13);
el.nodeViewHeaderIcon.innerHTML = svgIcon('info', 14);
el.nodeFormHeaderIcon.innerHTML = svgIcon('pencil', 14);
el.nodeFormClose.innerHTML = svgIcon('x', 13);
el.ticketFormHeaderIcon.innerHTML = svgIcon('ticket', 14);
el.ticketFormClose.innerHTML = svgIcon('x', 13);
el.edgeLabelHeaderIcon.innerHTML = svgIcon('tag', 14);
el.edgeLabelClose.innerHTML = svgIcon('x', 13);
el.folderFormHeaderIcon.innerHTML = svgIconSolid('folder', 14);
el.folderFormClose.innerHTML = svgIcon('x', 13);
el.loginBrandIcon.innerHTML = svgIcon('ticket', 26);
el.loginFeatureIcon1.innerHTML = svgIcon('layoutGrid', 15);
el.loginFeatureIcon2.innerHTML = svgIcon('link', 15);
el.loginFeatureIcon3.innerHTML = svgIconSolid('folder', 15);
el.githubLoginIcon.innerHTML = svgIconSolid('github', 18);
el.logoutBtn.innerHTML = svgIcon('x', 13);
el.logoutBtn.title = 'Esci';
document.querySelectorAll('.btn-icon[data-icon]').forEach((elm) => {
  elm.innerHTML = svgIcon(elm.dataset.icon, 14);
});
document.querySelectorAll('.md-format-btn span[data-icon]').forEach((elm) => {
  elm.innerHTML = svgIcon(elm.dataset.icon, 13);
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

// --- Sidebar collapse/expand ---

const SIDEBAR_STORAGE_KEY = 'kedalion-sidebar-collapsed';

function applySidebarCollapsed(collapsed) {
  el.sidebar.classList.toggle('collapsed', collapsed);
  el.sidebarExpandBtn.hidden = !collapsed;
}

function setSidebarCollapsed(collapsed) {
  applySidebarCollapsed(collapsed);
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0');
  } catch (e) {
    // Storage may be unavailable; the state still applies for this session.
  }
}

el.sidebarCollapseBtn.innerHTML = svgIcon('panelLeft', 14);
el.sidebarExpandBtn.innerHTML = svgIcon('panelLeft', 16);

let sidebarCollapsedInit = false;
try {
  sidebarCollapsedInit = localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
} catch (e) {
  // ignore
}
applySidebarCollapsed(sidebarCollapsedInit);

el.sidebarCollapseBtn.addEventListener('click', () => setSidebarCollapsed(true));
el.sidebarExpandBtn.addEventListener('click', () => setSidebarCollapsed(false));

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
  const formatToolbar = document.querySelector(`.md-format-toolbar[data-target="${target}"]`);
  tabs.querySelectorAll('.md-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      tabs.querySelectorAll('.md-tab').forEach((t) => t.classList.toggle('active', t === tab));
      if (mode === 'preview') {
        preview.innerHTML = renderMarkdown(textarea.value);
        textarea.hidden = true;
        preview.hidden = false;
        formatToolbar.hidden = true;
      } else {
        textarea.hidden = false;
        preview.hidden = true;
        formatToolbar.hidden = false;
      }
    });
  });
});

function resetMarkdownTabs(target) {
  const tabs = document.querySelector(`.md-tabs[data-target="${target}"]`);
  const textarea = document.getElementById(`${target}-desc`);
  const preview = document.getElementById(`${target}-desc-preview`);
  const formatToolbar = document.querySelector(`.md-format-toolbar[data-target="${target}"]`);
  tabs.querySelectorAll('.md-tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === 'write'));
  textarea.hidden = false;
  preview.hidden = true;
  formatToolbar.hidden = false;
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

document.querySelectorAll('.md-format-toolbar').forEach((toolbar) => {
  const textarea = document.getElementById(`${toolbar.dataset.target}-desc`);
  toolbar.querySelectorAll('.md-format-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      wrapSelection(textarea, btn.dataset.marker);
      textarea.focus();
    });
  });
});

// --- Data loading ---

async function loadAll() {
  const [tickets, folders, allTags] = await Promise.all([api('/api/tickets'), api('/api/folders'), api('/api/tags')]);
  state.tickets = tickets;
  state.folders = folders;
  state.allTags = allTags;
  // Dropping a tag from every ticket (or renaming it away) removes it from
  // /api/tags too; drop any now-nonexistent tag from the active filter so it
  // doesn't keep silently hiding everything. state.activeTags always holds
  // lowercase keys (see toggleActiveTag), so this compares like with like.
  const availableLower = new Set(allTags.map((t) => t.toLowerCase()));
  for (const tag of [...state.activeTags]) {
    if (!availableLower.has(tag)) state.activeTags.delete(tag);
  }
  renderTicketTree();
  populateFolderSelect();
  renderTagFilterList();
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
  let filtered = query
    ? state.tickets.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          state.searchNodeMatchIds.has(t.id) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(query))
      )
    : state.tickets;
  if (state.activeTags.size > 0) {
    filtered = filtered.filter((t) => {
      const ticketTagsLower = (t.tags || []).map((tag) => tag.toLowerCase());
      return [...state.activeTags].every((tag) => ticketTagsLower.includes(tag));
    });
  }
  const isFiltering = Boolean(query) || state.activeTags.size > 0;

  el.ticketTree.innerHTML = '';

  if (state.tickets.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'tree-empty';
    empty.textContent = 'Nessun ticket. Creane uno con il pulsante +.';
    el.ticketTree.appendChild(empty);
    return;
  }

  if (isFiltering && filtered.length === 0) {
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
    if (isFiltering && items.length === 0) continue;
    el.ticketTree.appendChild(renderFolderGroup(folder, items));
  }

  // Always render the "unfiled" bucket (even empty) so it stays a valid drag-and-drop
  // target for moving a ticket out of a folder; only hide it while a search matches nothing.
  if (!(isFiltering && unfiled.length === 0)) {
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
    <span class="folder-icon">${svgIconSolid('folder', 14)}</span>
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
    saveCollapsedFolders();
    renderTicketTree();
  });

  // Folder headers are themselves draggable (to reorder folders among each other),
  // separately from tickets being dragged onto them (to file/move a ticket) — the
  // two drags are told apart by which dataTransfer type carries the payload.
  if (folder) {
    header.draggable = true;
    header.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      e.dataTransfer.setData('application/x-kedalion-folder', folder.id);
      e.dataTransfer.effectAllowed = 'move';
      header.classList.add('dragging');
    });
    header.addEventListener('dragend', () => header.classList.remove('dragging'));
  }

  header.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    header.classList.add('drop-target');
  });
  header.addEventListener('dragleave', () => header.classList.remove('drop-target'));
  header.addEventListener('drop', async (e) => {
    e.preventDefault();
    header.classList.remove('drop-target');

    if (e.dataTransfer.types.includes('application/x-kedalion-folder')) {
      const draggedFolderId = e.dataTransfer.getData('application/x-kedalion-folder');
      if (!folder || draggedFolderId === folder.id) return;
      const order = state.folders.map((f) => f.id);
      const fromIndex = order.indexOf(draggedFolderId);
      if (fromIndex === -1) return;
      order.splice(fromIndex, 1);
      order.splice(order.indexOf(folder.id), 0, draggedFolderId);
      await api('/api/folders/reorder', { method: 'PUT', body: JSON.stringify({ orderIds: order }) });
      await loadAll();
      return;
    }

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
    header.querySelector('.folder-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteFolderFlow(folder);
    });
    header.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showContextMenu(e.clientX, e.clientY, [
        { label: 'Rinomina', icon: 'pencil', action: () => openRenameFolderForm(folder, e.clientX, e.clientY) },
        { label: 'Esporta', icon: 'download', action: () => exportFolderFlow(folder) },
        'separator',
        { label: 'Elimina', icon: 'trash', danger: true, action: () => deleteFolderFlow(folder) },
      ]);
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

function renderTicketItem(t) {
  const item = document.createElement('div');
  item.className = 'ticket-item' + (t.id === state.currentTicketId ? ' active' : '');
  item.innerHTML = `
    <span class="t-icon">${svgIcon('ticket', 14)}</span>
    <div class="t-info">
      <div class="t-title"></div>
      <div class="t-tags"></div>
    </div>
    <button class="delete-ticket" title="Elimina ticket">${svgIcon('trash', 13)}</button>
  `;
  item.querySelector('.t-title').textContent = t.title;
  if (t.tags && t.tags.length > 0) {
    const tagsEl = item.querySelector('.t-tags');
    for (const tag of t.tags) {
      const pill = document.createElement('span');
      pill.className = 't-tag';
      pill.textContent = tag;
      tagsEl.appendChild(pill);
    }
  }
  item.title = t.status === 'done' ? 'Completato' : 'Aperto';
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
  item.querySelector('.delete-ticket').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTicketFlow(t);
  });
  item.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(e.clientX, e.clientY, [
      { label: 'Modifica', icon: 'pencil', action: () => openRenameTicketForm(t, e.clientX, e.clientY) },
      { label: 'Esporta', icon: 'download', action: () => exportTicketFlow(t) },
      'separator',
      { label: 'Elimina', icon: 'trash', danger: true, action: () => deleteTicketFlow(t) },
    ]);
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
  if (groupDragRenderPending) {
    cancelAnimationFrame(groupDragRenderHandle);
    groupDragRenderPending = false;
  }
  resetUndoHistory();

  const ticket = state.tickets.find((t) => t.id === id) || (await api(`/api/tickets/${id}`));
  el.ticketTitle.textContent = ticket.title;
  const hasTicketDesc = !!(ticket.description && ticket.description.trim());
  el.ticketDesc.innerHTML = hasTicketDesc ? renderMarkdown(ticket.description) : '';
  el.ticketDesc.hidden = !hasTicketDesc;
  el.ticketDescEmpty.hidden = hasTicketDesc;
  renderHeaderTags(ticket.tags || []);
  el.emptyState.hidden = true;
  el.ticketView.hidden = false;

  state.graph = await api(`/api/tickets/${id}/graph`);
  centerGraphView();
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
    state.searchNodeMatchIds = new Set();
    clearTimeout(searchDebounceTimer);
    renderTicketTree();
  }
});

el.tagsBtn.addEventListener('click', () => {
  const showing = el.tagFilterBox.hidden;
  el.tagFilterBox.hidden = !showing;
  el.tagsBtn.classList.toggle('active', showing);
});

// state.activeTags always holds lowercase keys, since a ticket's own tag
// casing can differ from the canonical casing /api/tags returns for the same
// logical tag — comparing case-sensitively would let the two diverge.
function toggleActiveTag(tag) {
  const key = tag.toLowerCase();
  if (state.activeTags.has(key)) state.activeTags.delete(key);
  else state.activeTags.add(key);
}

// Shows the open ticket's own tags under its title; clicking one toggles it
// as a sidebar tag filter, so jumping to "everything else tagged like this" is one click.
function renderHeaderTags(tags) {
  el.ticketTags.innerHTML = '';
  el.ticketTags.hidden = tags.length === 0;
  for (const tag of tags) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'tag-chip-static';
    chip.textContent = tag;
    chip.title = 'Filtra per questo tag';
    chip.addEventListener('click', () => {
      toggleActiveTag(tag);
      el.tagFilterBox.hidden = false;
      el.tagsBtn.classList.add('active');
      renderTagFilterList();
      renderTicketTree();
    });
    el.ticketTags.appendChild(chip);
  }
}

function renderTagFilterList() {
  el.tagFilterList.innerHTML = '';
  el.tagFilterEmpty.hidden = state.allTags.length > 0;
  el.tagsBtn.classList.toggle('has-active', state.activeTags.size > 0);
  for (const tag of state.allTags) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'tag-filter-chip' + (state.activeTags.has(tag.toLowerCase()) ? ' active' : '');
    chip.textContent = tag;
    chip.addEventListener('click', () => {
      toggleActiveTag(tag);
      renderTagFilterList();
      renderTicketTree();
    });
    el.tagFilterList.appendChild(chip);
  }
}

let searchDebounceTimer = null;

el.searchInput.addEventListener('input', () => {
  state.searchQuery = el.searchInput.value;
  state.searchNodeMatchIds = new Set();
  renderTicketTree();

  clearTimeout(searchDebounceTimer);
  const q = state.searchQuery.trim();
  if (!q) return;
  searchDebounceTimer = setTimeout(async () => {
    try {
      const result = await api(`/api/search?q=${encodeURIComponent(q)}`);
      if (state.searchQuery.trim() !== q) return; // query changed while the request was in flight
      state.searchNodeMatchIds = new Set(result.ticketIds);
      renderTicketTree();
    } catch {
      // a failed background search just means no extra node matches — the title
      // filter above still works, so this fails silently rather than with a toast.
    }
  }, 250);
});

let ticketFormEditId = null; // null while creating a new ticket, otherwise the id being renamed

// A small chip-input widget: renders tags as removable pills before the text
// input, and turns Enter/comma/blur on the input into "commit this as a tag".
const MAX_TAGS_PER_TICKET = 15; // mirrors server/store.js — enforced there too, but warn here instead of silently dropping

function setupTagInput(container, inputEl) {
  let tags = [];
  function render() {
    container.querySelectorAll('.tag-chip').forEach((c) => c.remove());
    for (const tag of tags) {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      const label = document.createElement('span');
      label.className = 'tag-chip-label';
      label.textContent = tag;
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'tag-chip-remove';
      removeBtn.setAttribute('aria-label', 'Rimuovi tag');
      removeBtn.innerHTML = svgIcon('x', 10);
      removeBtn.addEventListener('click', () => {
        tags = tags.filter((t) => t !== tag);
        render();
      });
      chip.appendChild(label);
      chip.appendChild(removeBtn);
      container.insertBefore(chip, inputEl);
    }
  }
  function commitInput() {
    const raw = inputEl.value.trim().slice(0, 24);
    inputEl.value = '';
    if (!raw) return;
    if (tags.length >= MAX_TAGS_PER_TICKET) {
      showToast(`Massimo ${MAX_TAGS_PER_TICKET} tag per ticket.`, 'error');
      return;
    }
    if (!tags.some((t) => t.toLowerCase() === raw.toLowerCase())) tags.push(raw);
    render();
  }
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitInput();
    } else if (e.key === 'Backspace' && !inputEl.value && tags.length > 0) {
      tags.pop();
      render();
    }
  });
  inputEl.addEventListener('blur', () => commitInput());
  return {
    getTags: () => tags.slice(),
    setTags: (newTags) => {
      tags = (newTags || []).slice();
      render();
    },
  };
}

const ticketFormTagInput = setupTagInput(el.ticketFormTags, el.ticketFormTagsInput);

el.newTicketBtn.addEventListener('click', () => {
  ticketFormEditId = null;
  el.ticketFormHeaderTitle.textContent = 'Nuovo ticket';
  el.ticketFormSubmit.textContent = 'Crea ticket';
  el.ticketFormTitle.value = '';
  el.ticketFormDesc.value = '';
  // Defaults to the currently open ticket's folder: when triaging several
  // tickets into the same folder in a row, this saves reselecting it every time.
  const currentTicket = state.tickets.find((t) => t.id === state.currentTicketId);
  el.ticketFormFolder.value = (currentTicket && currentTicket.folderId) || '';
  ticketFormTagInput.setTags([]);
  resetMarkdownTabs('ticket-form');
  const btnRect = el.newTicketBtn.getBoundingClientRect();
  openFormPopover(el.ticketFormPopover, btnRect.right + 8, btnRect.top, () => el.ticketFormTitle.focus());
});

function openRenameTicketForm(ticket, clientX, clientY) {
  ticketFormEditId = ticket.id;
  el.ticketFormHeaderTitle.textContent = 'Modifica ticket';
  el.ticketFormSubmit.textContent = 'Salva';
  el.ticketFormTitle.value = ticket.title;
  el.ticketFormDesc.value = ticket.description || '';
  el.ticketFormFolder.value = ticket.folderId || '';
  ticketFormTagInput.setTags(ticket.tags || []);
  resetMarkdownTabs('ticket-form');
  openFormPopover(el.ticketFormPopover, clientX, clientY, () => el.ticketFormTitle.select());
}

el.ticketEditBtn.addEventListener('click', () => {
  const ticket = state.tickets.find((t) => t.id === state.currentTicketId);
  if (!ticket) return;
  const btnRect = el.ticketEditBtn.getBoundingClientRect();
  openRenameTicketForm(ticket, btnRect.left, btnRect.bottom + 8);
});

el.ticketFormCancel.addEventListener('click', () => closeFormPopover(el.ticketFormPopover, el.ticketForm));
el.ticketFormClose.addEventListener('click', () => closeFormPopover(el.ticketFormPopover, el.ticketForm));

el.ticketForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = el.ticketFormTitle.value.trim();
  if (!title) return;
  const description = el.ticketFormDesc.value.trim();
  const folderId = el.ticketFormFolder.value || undefined;
  // Pick up whatever's still sitting in the tag input's text box (typed but
  // not yet committed with Enter) so it isn't silently lost on submit.
  el.ticketFormTagsInput.blur();
  const tags = ticketFormTagInput.getTags();
  const editId = ticketFormEditId;
  closeFormPopover(el.ticketFormPopover, el.ticketForm);
  try {
    if (editId) {
      await api(`/api/tickets/${editId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, description, folderId: folderId || null, tags }),
      });
      await loadAll();
      if (state.currentTicketId === editId) selectTicket(editId);
    } else {
      const ticket = await api('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({ title, description, folderId, tags }),
      });
      await loadAll();
      selectTicket(ticket.id);
    }
  } catch (err) {
    showToast(editId ? 'Rinomina del ticket non riuscita: riprova.' : 'Creazione del ticket non riuscita: riprova.', 'error');
  }
});

async function deleteTicketFlow(ticket) {
  const ok = await askConfirm({
    title: 'Eliminare il ticket?',
    message: `"${ticket.title}" e tutto il suo grafo verranno eliminati. L'operazione non è reversibile.`,
    confirmLabel: 'Elimina ticket',
  });
  if (!ok) return;
  await api(`/api/tickets/${ticket.id}`, { method: 'DELETE' });
  if (state.currentTicketId === ticket.id) {
    state.currentTicketId = null;
    showEmptyState();
  }
  await loadAll();
  showToast(`Ticket "${ticket.title}" eliminato.`, 'success');
}

let folderFormEditId = null; // null while creating a new folder, otherwise the id being renamed

el.newFolderBtn.addEventListener('click', () => {
  folderFormEditId = null;
  el.folderFormHeaderTitle.textContent = 'Nuova cartella';
  el.folderFormSubmit.textContent = 'Crea cartella';
  el.folderFormName.value = '';
  const btnRect = el.newFolderBtn.getBoundingClientRect();
  openFormPopover(el.folderFormPopover, btnRect.right + 8, btnRect.top, () => el.folderFormName.focus());
});

function openRenameFolderForm(folder, clientX, clientY) {
  folderFormEditId = folder.id;
  el.folderFormHeaderTitle.textContent = 'Rinomina cartella';
  el.folderFormSubmit.textContent = 'Salva';
  el.folderFormName.value = folder.name;
  openFormPopover(el.folderFormPopover, clientX, clientY, () => el.folderFormName.select());
}

el.folderFormCancel.addEventListener('click', () => closeFormPopover(el.folderFormPopover, el.folderForm));
el.folderFormClose.addEventListener('click', () => closeFormPopover(el.folderFormPopover, el.folderForm));

el.folderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = el.folderFormName.value.trim();
  if (!name) return;
  const editId = folderFormEditId;
  closeFormPopover(el.folderFormPopover, el.folderForm);
  try {
    if (editId) {
      await api(`/api/folders/${editId}`, { method: 'PUT', body: JSON.stringify({ name }) });
    } else {
      await api('/api/folders', { method: 'POST', body: JSON.stringify({ name }) });
    }
    await loadAll();
  } catch (err) {
    showToast(editId ? 'Rinomina della cartella non riuscita: riprova.' : 'Creazione della cartella non riuscita: riprova.', 'error');
  }
});

async function deleteFolderFlow(folder) {
  const ok = await askConfirm({
    title: 'Eliminare la cartella?',
    message: `"${folder.name}" verrà eliminata. I ticket al suo interno non verranno eliminati, solo spostati fuori dalla cartella.`,
    confirmLabel: 'Elimina cartella',
  });
  if (!ok) return;
  await api(`/api/folders/${folder.id}`, { method: 'DELETE' });
  await loadAll();
  showToast(`Cartella "${folder.name}" eliminata.`, 'success');
}

// Bundles every ticket in a folder (and its graph) into a single .kn file, so a
// whole folder can be exported/re-imported as one unit instead of ticket by ticket.
async function exportFolderFlow(folder) {
  const tickets = state.tickets.filter((t) => t.folderId === folder.id);
  if (tickets.length === 0) {
    showToast('La cartella è vuota, niente da esportare.', 'error');
    return;
  }
  try {
    const bundle = await Promise.all(
      tickets.map(async (t) => {
        const graph = await api(`/api/tickets/${t.id}/graph`);
        return {
          ticket: { title: t.title, description: t.description || '', status: t.status || 'open' },
          graph: { nodes: graph.nodes, edges: graph.edges },
        };
      })
    );
    const payload = { kedalionExport: 1, type: 'folder', folder: { name: folder.name }, tickets: bundle };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = slugifyFilename(folder.name);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Cartella esportata.', 'success');
  } catch (err) {
    showToast('Esportazione della cartella non riuscita: riprova.', 'error');
  }
}

// --- Ticket import / export ---

function slugifyFilename(title) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (slug || 'ticket') + '.kn';
}

// Exports a single ticket as a .kn file. Reads the graph via the API rather than
// state.graph so this works for any ticket, not just the one currently open.
async function exportTicketFlow(ticket) {
  try {
    const graph =
      ticket.id === state.currentTicketId ? state.graph : await api(`/api/tickets/${ticket.id}/graph`);
    const payload = {
      kedalionExport: 1,
      ticket: {
        title: ticket.title,
        description: ticket.description || '',
        status: ticket.status || 'open',
        tags: ticket.tags || [],
      },
      graph: { nodes: graph.nodes, edges: graph.edges },
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
  } catch (err) {
    showToast('Esportazione del ticket non riuscita: riprova.', 'error');
  }
}

el.exportTicketBtn.addEventListener('click', () => {
  const ticket = state.tickets.find((t) => t.id === state.currentTicketId);
  if (!ticket) return;
  exportTicketFlow(ticket);
});

el.importBtn.addEventListener('click', () => {
  el.importFileInput.value = '';
  el.importFileInput.click();
});

// Imports a folder bundle exported by exportFolderFlow(): creates a new folder
// (even if a folder with the same name already exists, to avoid silently merging
// into it) and every ticket + graph inside it.
async function importFolderBundle(data) {
  const folderName = (data.folder && data.folder.name && data.folder.name.trim()) || 'Cartella importata';
  const folder = await api('/api/folders', { method: 'POST', body: JSON.stringify({ name: folderName }) });
  let importedCount = 0;
  for (const entry of data.tickets) {
    const t = (entry && entry.ticket) || {};
    const title = (t.title || '').trim();
    if (!title) continue;
    const created = await api('/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ title, description: t.description || '', folderId: folder.id, tags: t.tags }),
    });
    if (t.status === 'done') {
      await api(`/api/tickets/${created.id}`, { method: 'PUT', body: JSON.stringify({ status: 'done' }) });
    }
    const g = (entry && entry.graph) || {};
    const nodes = Array.isArray(g.nodes) ? g.nodes : [];
    const edges = Array.isArray(g.edges) ? g.edges : [];
    if (nodes.length > 0 || edges.length > 0) {
      await api(`/api/tickets/${created.id}/graph`, { method: 'PUT', body: JSON.stringify({ nodes, edges }) });
    }
    importedCount++;
  }
  await loadAll();
  showToast(`Cartella "${folderName}" importata (${importedCount} ticket).`, 'success');
}

el.importFileInput.addEventListener('change', async () => {
  const file = el.importFileInput.files && el.importFileInput.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (data.type === 'folder' && Array.isArray(data.tickets)) {
      await importFolderBundle(data);
      return;
    }

    const importedTicket = data.ticket || data; // tolerate a bare {title, description, ...} file too
    const title = (importedTicket.title || '').trim();
    if (!title) throw new Error('missing title');
    const description = importedTicket.description || '';

    const created = await api('/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ title, description, tags: importedTicket.tags }),
    });

    if (importedTicket.status === 'done') {
      await api(`/api/tickets/${created.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'done' }),
      });
    }

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
    else if (openPopoverEl === el.nodeFormPopover) closeNodeForm();
    else if (openPopoverEl === el.edgeLabelPopover) closeEdgeLabelForm();
  }
}

function closeAllPopovers() {
  if (!el.ticketFormPopover.hidden) closeFormPopover(el.ticketFormPopover, el.ticketForm);
  if (!el.folderFormPopover.hidden) closeFormPopover(el.folderFormPopover, el.folderForm);
  if (!el.nodeViewPopover.hidden) closeNodeView();
  if (!el.edgeLabelPopover.hidden) closeEdgeLabelForm();
  closeNodeForm();
}

// --- Graph: node CRUD ---

function addNodeAt(x, y, clientX, clientY, nodeType) {
  openNodeForm({
    clientX,
    clientY,
    initial: { label: '', description: '' },
    titleOverride: nodeType === 'conditional' ? 'Nuovo nodo condizionale' : undefined,
    onSubmit: ({ label, description }) => {
      pushUndo();
      const node = { id: genId(), label, description, done: false, x, y };
      if (nodeType) node.nodeType = nodeType;
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
      pushUndo();
      const newNode = { id: genId(), label, description, done: false, x, y };
      state.graph.nodes.push(newNode);
      state.graph.edges.push({ id: genId(), from: sourceNode.id, to: newNode.id });
      renderGraph();
      saveGraph();
    },
  });
}

// Title is only auto-derived (and therefore locked) for Start/End nodes;
// a conditional node's label is exactly what makes it useful, so it stays editable.
const LOCKED_TITLE_NODE_TYPES = new Set(['start', 'end']);

function editNode(node, clientX, clientY) {
  openNodeForm({
    clientX,
    clientY,
    initial: { label: node.label, description: node.description || '' },
    lockTitle: LOCKED_TITLE_NODE_TYPES.has(node.nodeType),
    onSubmit: ({ label, description }) => {
      pushUndo();
      if (!LOCKED_TITLE_NODE_TYPES.has(node.nodeType)) node.label = label;
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
el.nodeViewClose.addEventListener('click', () => closeNodeView());

// --- Node form popover ---

let nodeFormState = null;

function openNodeForm({ clientX, clientY, initial, onSubmit, lockTitle, titleOverride }) {
  closeAllPopovers();
  resetMarkdownTabs('node-form');
  nodeFormState = { onSubmit };
  el.nodeFormHeaderTitle.textContent = titleOverride || (initial.label ? 'Modifica nodo' : 'Nuovo nodo');
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
  openPopoverEl = popover;

  requestAnimationFrame(() => (lockTitle ? el.nodeFormDesc : el.nodeFormTitle).focus());
  setTimeout(() => document.addEventListener('click', onGenericPopoverOutsideClick), 0);
}

function closeNodeForm() {
  el.nodeFormPopover.hidden = true;
  if (openPopoverEl === el.nodeFormPopover) openPopoverEl = null;
  nodeFormState = null;
  el.nodeForm.reset();
  el.nodeFormTitle.readOnly = false;
  el.nodeFormTitle.classList.remove('locked');
  el.nodeFormTitleHint.hidden = true;
  document.removeEventListener('click', onGenericPopoverOutsideClick);
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
el.nodeFormClose.addEventListener('click', () => closeNodeForm());

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

// --- Copy / paste selected nodes (in-memory clipboard, not the OS one — this
// only ever needs to round-trip within the app, and skipping the Clipboard API
// avoids its permission prompts) ---

let nodeClipboard = null; // { nodes, edges } deep copies of the selection at the time of copying

function copySelectionToClipboard() {
  const ids =
    state.multiSelected.size > 0
      ? new Set(state.multiSelected)
      : state.selected && state.selected.type === 'node'
      ? new Set([state.selected.id])
      : null;
  if (!ids || ids.size === 0) return false;
  const nodes = state.graph.nodes.filter((n) => ids.has(n.id));
  const edges = state.graph.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  nodeClipboard = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };
  showToast(nodes.length === 1 ? 'Nodo copiato.' : `${nodes.length} nodi copiati.`, 'success');
  return true;
}

function pasteClipboard() {
  if (!nodeClipboard || nodeClipboard.nodes.length === 0) return;
  pushUndo();
  const PASTE_OFFSET = 32;
  const idMap = new Map();
  const newNodes = nodeClipboard.nodes.map((n) => {
    const newId = genId();
    idMap.set(n.id, newId);
    const clone = { ...n, id: newId, x: n.x + PASTE_OFFSET, y: n.y + PASTE_OFFSET };
    // Start/End are meant to be unique per graph — pasting a copy of one
    // demotes it to a plain node instead of creating a second marker.
    if (LOCKED_TITLE_NODE_TYPES.has(clone.nodeType)) delete clone.nodeType;
    return clone;
  });
  const newEdges = nodeClipboard.edges.map((e) => ({
    ...e,
    id: genId(),
    from: idMap.get(e.from),
    to: idMap.get(e.to),
  }));
  state.graph.nodes.push(...newNodes);
  state.graph.edges.push(...newEdges);
  state.selected = null;
  state.multiSelected = new Set(newNodes.map((n) => n.id));
  renderGraph();
  saveGraph();
}

function updateLinkModeUI() {
  el.linkModeBtn.classList.toggle('active', state.mode === 'link');
  el.linkHint.hidden = state.mode !== 'link';
}

async function saveGraph() {
  try {
    await api(`/api/tickets/${state.currentTicketId}/graph`, {
      method: 'PUT',
      body: JSON.stringify(state.graph),
    });
  } catch (err) {
    showToast('Salvataggio non riuscito: controlla la connessione e riprova.', 'error');
  }
}

// --- Undo / redo ---
// A snapshot is pushed onto undoStack right before each graph-mutating action
// (never after), so undo always restores the state as it was just before that
// action ran. Redo is cleared on any new action, matching standard editor behavior.

let undoStack = [];
let redoStack = [];
const MAX_UNDO_STACK = 60;
let undoRedoInProgress = false;

function snapshotGraph() {
  return {
    nodes: JSON.parse(JSON.stringify(state.graph.nodes)),
    edges: JSON.parse(JSON.stringify(state.graph.edges)),
  };
}

function updateUndoRedoUI() {
  el.undoBtn.disabled = undoStack.length === 0;
  el.redoBtn.disabled = redoStack.length === 0;
}

function pushUndo() {
  if (undoRedoInProgress) return;
  undoStack.push(snapshotGraph());
  if (undoStack.length > MAX_UNDO_STACK) undoStack.shift();
  redoStack.length = 0;
  updateUndoRedoUI();
}

function resetUndoHistory() {
  undoStack = [];
  redoStack = [];
  updateUndoRedoUI();
}

function applyGraphSnapshot(snapshot) {
  undoRedoInProgress = true;
  state.graph.nodes = snapshot.nodes;
  state.graph.edges = snapshot.edges;
  state.selected = null;
  state.multiSelected.clear();
  renderGraph();
  saveGraph();
  undoRedoInProgress = false;
}

function doUndo() {
  if (undoStack.length === 0) return;
  const current = snapshotGraph();
  const prev = undoStack.pop();
  redoStack.push(current);
  applyGraphSnapshot(prev);
  updateUndoRedoUI();
}

function doRedo() {
  if (redoStack.length === 0) return;
  const current = snapshotGraph();
  const next = redoStack.pop();
  undoStack.push(current);
  applyGraphSnapshot(next);
  updateUndoRedoUI();
}

el.undoBtn.addEventListener('click', doUndo);
el.redoBtn.addEventListener('click', doRedo);

function addNodeAtCenter(clientX, clientY, nodeType) {
  const center = viewCenterGraphPoint();
  const x = center.x + (Math.random() * 60 - 30);
  const y = center.y + (Math.random() * 60 - 30);
  addNodeAt(x, y, clientX, clientY, nodeType);
}

el.addNodeMenuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const btnRect = el.addNodeMenuBtn.getBoundingClientRect();
  const clientX = btnRect.left;
  const clientY = btnRect.bottom + 6;
  const hasStart = state.graph.nodes.some((n) => n.nodeType === 'start');
  const hasEnd = state.graph.nodes.some((n) => n.nodeType === 'end');
  showContextMenu(clientX, clientY, [
    { label: 'Nodo', icon: 'plus', action: () => addNodeAtCenter(clientX, clientY) },
    { label: 'Nodo condizionale', icon: 'gitBranch', action: () => addNodeAtCenter(clientX, clientY, 'conditional') },
    'separator',
    { label: hasStart ? 'Vai al nodo di inizio' : 'Nodo di inizio', icon: 'play', action: () => addSpecialNode('start') },
    { label: hasEnd ? 'Vai al nodo di fine' : 'Nodo di fine', icon: 'flag', action: () => addSpecialNode('end') },
  ]);
});

el.linkModeBtn.addEventListener('click', () => {
  state.mode = state.mode === 'link' ? 'idle' : 'link';
  state.linkFirst = null;
  updateLinkModeUI();
});

el.centerViewBtn.addEventListener('click', () => {
  centerGraphView();
  renderGraph();
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
    panToNode(existing);
    renderGraph();
    return;
  }
  const center = viewCenterGraphPoint();
  const otherType = nodeType === 'start' ? 'end' : 'start';
  const other = state.graph.nodes.find((n) => n.nodeType === otherType);
  let x;
  if (other) {
    x = nodeType === 'start' ? Math.max(80, other.x - 260) : other.x + 260;
  } else {
    x = nodeType === 'start' ? center.x - 200 : center.x + 200;
  }
  const y = center.y;
  const node = {
    id: genId(),
    label: nodeType === 'start' ? 'Inizio' : 'Fine',
    description: '',
    done: false,
    nodeType,
    x,
    y,
  };
  pushUndo();
  state.graph.nodes.push(node);
  state.selected = { type: 'node', id: node.id };
  renderGraph();
  saveGraph();
}

// --- Edge labels (e.g. "Sì" / "No" branches out of a conditional node) ---

let edgeLabelState = null; // the edge currently being labeled

function openEdgeLabelForm(edge, clientX, clientY) {
  closeAllPopovers();
  edgeLabelState = edge;
  el.edgeLabelInput.value = edge.label || '';
  hideContextMenu();

  const popover = el.edgeLabelPopover;
  popover.hidden = false;
  const popW = 290;
  const popH = popover.offsetHeight || 110;
  const margin = 12;
  let left = (clientX ?? window.innerWidth / 2) + 8;
  let top = (clientY ?? window.innerHeight / 2) + 8;
  left = Math.min(left, window.innerWidth - popW - margin);
  top = Math.min(top, window.innerHeight - popH - margin);
  left = Math.max(margin, left);
  top = Math.max(margin, top);
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  openPopoverEl = popover;
  requestAnimationFrame(() => el.edgeLabelInput.focus());
  setTimeout(() => document.addEventListener('click', onGenericPopoverOutsideClick), 0);
}

function closeEdgeLabelForm() {
  el.edgeLabelPopover.hidden = true;
  if (openPopoverEl === el.edgeLabelPopover) openPopoverEl = null;
  edgeLabelState = null;
  el.edgeLabelForm.reset();
  document.removeEventListener('click', onGenericPopoverOutsideClick);
}

el.edgeLabelForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const edge = edgeLabelState;
  if (!edge) return;
  const label = el.edgeLabelInput.value.trim();
  closeEdgeLabelForm();
  pushUndo();
  if (label) edge.label = label;
  else delete edge.label;
  renderGraph();
  saveGraph();
});

el.edgeLabelCancel.addEventListener('click', () => closeEdgeLabelForm());
el.edgeLabelClose.addEventListener('click', () => closeEdgeLabelForm());

el.deleteSelectionBtn.addEventListener('click', async () => {
  if (state.multiSelected.size > 0) {
    const count = state.multiSelected.size;
    if (count > 1) {
      const ok = await askConfirm({
        title: 'Eliminare i nodi selezionati?',
        message: `${count} nodi e i loro collegamenti verranno eliminati.`,
        confirmLabel: 'Elimina',
      });
      if (!ok) return;
    }
    pushUndo();
    for (const id of state.multiSelected) removeNode(id);
    state.multiSelected.clear();
    renderGraph();
    saveGraph();
    return;
  }
  if (!state.selected) return;
  pushUndo();
  if (state.selected.type === 'node') removeNode(state.selected.id);
  else removeEdge(state.selected.id);
  state.selected = null;
  renderGraph();
  saveGraph();
});

function isTypingInField() {
  const tag = document.activeElement && document.activeElement.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
}

// Centers the view on a single node (used by Tab navigation and the "vai a
// Inizio/Fine" command) without touching the current zoom level.
function panToNode(node) {
  const rect = el.svg.getBoundingClientRect();
  state.pan.x = rect.width / 2 - node.x * state.zoom;
  state.pan.y = rect.height / 2 - node.y * state.zoom;
}

function jumpToSpecialNode(nodeType) {
  const node = state.graph.nodes.find((n) => n.nodeType === nodeType);
  if (!node) {
    showToast(nodeType === 'start' ? 'Nessun nodo di Inizio in questo grafo.' : 'Nessun nodo di Fine in questo grafo.', 'error');
    return;
  }
  state.selected = { type: 'node', id: node.id };
  state.multiSelected.clear();
  panToNode(node);
  renderGraph();
}

// Tab / Shift+Tab step through the graph's nodes without the mouse, in a stable
// left-to-right, top-to-bottom reading order (independent of edges, so it still
// works on graphs with disconnected branches).
function stepNodeSelection(reverse) {
  const nodes = [...state.graph.nodes].sort((a, b) => a.x - b.x || a.y - b.y);
  if (nodes.length === 0) return;
  const currentId = state.selected && state.selected.type === 'node' ? state.selected.id : null;
  const currentIndex = nodes.findIndex((n) => n.id === currentId);
  let nextIndex;
  if (reverse) {
    nextIndex = currentIndex <= 0 ? nodes.length - 1 : currentIndex - 1;
  } else {
    nextIndex = currentIndex === -1 || currentIndex === nodes.length - 1 ? 0 : currentIndex + 1;
  }
  const node = nodes[nextIndex];
  state.selected = { type: 'node', id: node.id };
  state.multiSelected.clear();
  panToNode(node);
  renderGraph();
}

// --- Command palette (Ctrl+K) ---

let cmdkFiltered = [];
let cmdkActiveIndex = 0;

function buildCommandList() {
  const items = [];
  const ticketOpen = !el.ticketView.hidden;

  items.push({ icon: 'plus', label: 'Nuovo ticket', hint: 'Crea', action: () => el.newTicketBtn.click() });
  items.push({ icon: 'folderPlus', label: 'Nuova cartella', hint: 'Crea', action: () => el.newFolderBtn.click() });
  items.push({ icon: 'sun', label: 'Cambia tema chiaro/scuro', hint: 'Vista', action: () => el.themeToggleBtn.click() });
  items.push({
    icon: 'panelLeft',
    label: 'Comprimi/espandi sidebar',
    hint: 'Vista',
    action: () => setSidebarCollapsed(!el.sidebar.classList.contains('collapsed')),
  });

  if (ticketOpen) {
    items.push({ icon: 'plus', label: 'Aggiungi nodo', hint: 'Grafo', action: () => addNodeAtCenter() });
    items.push({ icon: 'gitBranch', label: 'Aggiungi nodo condizionale', hint: 'Grafo', action: () => addNodeAtCenter(undefined, undefined, 'conditional') });
    items.push({ icon: 'play', label: 'Vai al nodo di Inizio', hint: 'Grafo', action: () => jumpToSpecialNode('start') });
    items.push({ icon: 'flag', label: 'Vai al nodo di Fine', hint: 'Grafo', action: () => jumpToSpecialNode('end') });
    items.push({ icon: 'layoutGrid', label: 'Riordina automaticamente i nodi', hint: 'Grafo', action: () => el.autoLayoutBtn.click() });
    items.push({ icon: 'maximize', label: 'Centra vista', hint: 'Grafo', action: () => el.centerViewBtn.click() });
    items.push({ icon: 'download', label: 'Esporta questo ticket', hint: 'Grafo', action: () => el.exportTicketBtn.click() });
  }

  for (const t of state.tickets) {
    const folder = state.folders.find((f) => f.id === t.folderId);
    items.push({
      icon: 'ticket',
      label: t.title,
      hint: folder ? folder.name : 'Senza cartella',
      action: () => selectTicket(t.id),
    });
  }
  return items;
}

function setCmdkActive(index) {
  cmdkActiveIndex = index;
  el.cmdkList.querySelectorAll('.cmdk-item').forEach((row, i) => {
    row.classList.toggle('active', i === index);
    if (i === index) row.scrollIntoView({ block: 'nearest' });
  });
}

function runCommand(item) {
  closeCommandPalette();
  item.action();
}

function renderCommandList(query) {
  const q = query.trim().toLowerCase();
  const all = buildCommandList();
  cmdkFiltered = (q ? all.filter((it) => it.label.toLowerCase().includes(q) || (it.hint || '').toLowerCase().includes(q)) : all).slice(0, 40);
  el.cmdkList.innerHTML = '';
  el.cmdkEmpty.hidden = cmdkFiltered.length > 0;
  cmdkFiltered.forEach((item, i) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'cmdk-item';
    row.innerHTML = '<span class="cmdk-item-icon"></span><span class="cmdk-item-label"></span><span class="cmdk-item-hint"></span>';
    row.querySelector('.cmdk-item-icon').innerHTML = svgIcon(item.icon, 15);
    row.querySelector('.cmdk-item-label').textContent = item.label;
    row.querySelector('.cmdk-item-hint').textContent = item.hint || '';
    row.addEventListener('mouseenter', () => setCmdkActive(i));
    row.addEventListener('click', () => runCommand(item));
    el.cmdkList.appendChild(row);
  });
  setCmdkActive(0);
}

function openCommandPalette() {
  closeAllPopovers();
  hideContextMenu();
  el.cmdkInput.value = '';
  renderCommandList('');
  el.cmdkOverlay.hidden = false;
  requestAnimationFrame(() => el.cmdkInput.focus());
}

function closeCommandPalette() {
  el.cmdkOverlay.hidden = true;
}

el.cmdkInput.addEventListener('input', () => renderCommandList(el.cmdkInput.value));
el.cmdkOverlay.addEventListener('click', (e) => {
  if (e.target === el.cmdkOverlay) closeCommandPalette();
});
el.cmdkInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (cmdkFiltered.length > 0) setCmdkActive((cmdkActiveIndex + 1) % cmdkFiltered.length);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (cmdkFiltered.length > 0) setCmdkActive((cmdkActiveIndex - 1 + cmdkFiltered.length) % cmdkFiltered.length);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const item = cmdkFiltered[cmdkActiveIndex];
    if (item) runCommand(item);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeCommandPalette();
  }
});

document.addEventListener('keydown', (e) => {
  // Kedalion saves automatically after every change, so Ctrl/Cmd+S has nothing
  // useful to do — but the browser's own "Save Page As..." would otherwise
  // trigger, which is never what's wanted here. Always intercept it, regardless
  // of what else is open, so it never reaches the browser.
  if (e.key.toLowerCase() === 's' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (!el.ticketView.hidden && state.currentTicketId) {
      showToast('Salvato automaticamente.', 'success');
    }
    return;
  }
  if (!el.cmdkOverlay.hidden) {
    return; // the palette's own input keydown handler (above) owns arrows/enter/escape while open
  }
  if (!el.confirmOverlay.hidden) {
    if (e.key === 'Escape') closeConfirm(false);
    else if (e.key === 'Enter') closeConfirm(true);
    return;
  }
  if (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey) && !isTypingInField()) {
    e.preventDefault();
    openCommandPalette();
    return;
  }
  if (e.key === 'Escape') {
    state.mode = 'idle';
    state.linkFirst = null;
    state.multiSelected.clear();
    state.selected = null;
    updateLinkModeUI();
    renderGraph();
    closeAllPopovers();
    hideContextMenu();
    if (!el.searchBox.hidden && document.activeElement === el.searchInput) el.searchBtn.click();
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if ((state.selected || state.multiSelected.size > 0) && document.activeElement === document.body) {
      el.deleteSelectionBtn.click();
    }
  } else if (e.key === '/' && !isTypingInField() && !el.appRoot.hidden) {
    e.preventDefault();
    if (el.searchBox.hidden) el.searchBtn.click();
    else el.searchInput.focus();
  } else if (e.key.toLowerCase() === 'b' && (e.ctrlKey || e.metaKey) && !isTypingInField() && !el.appRoot.hidden) {
    e.preventDefault();
    setSidebarCollapsed(!el.sidebar.classList.contains('collapsed'));
  } else if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey) && !isTypingInField() && !el.ticketView.hidden) {
    e.preventDefault();
    if (e.shiftKey) doRedo();
    else doUndo();
  } else if (e.key.toLowerCase() === 'y' && (e.ctrlKey || e.metaKey) && !isTypingInField() && !el.ticketView.hidden) {
    e.preventDefault();
    doRedo();
  } else if (e.key.toLowerCase() === 'a' && (e.ctrlKey || e.metaKey) && !isTypingInField() && !el.ticketView.hidden) {
    e.preventDefault();
    if (state.graph.nodes.length === 0) return;
    state.selected = null;
    state.multiSelected = new Set(state.graph.nodes.map((n) => n.id));
    renderGraph();
  } else if (e.key.toLowerCase() === 'c' && (e.ctrlKey || e.metaKey) && !isTypingInField() && !el.ticketView.hidden) {
    if (copySelectionToClipboard()) e.preventDefault();
  } else if (e.key.toLowerCase() === 'v' && (e.ctrlKey || e.metaKey) && !isTypingInField() && !el.ticketView.hidden) {
    if (nodeClipboard) {
      e.preventDefault();
      pasteClipboard();
    }
  } else if (e.key === 'Tab' && !isTypingInField() && !openPopoverEl && el.contextMenu.hidden && !el.ticketView.hidden) {
    if (state.graph.nodes.length === 0) return;
    e.preventDefault();
    stepNodeSelection(e.shiftKey);
  }
});

let marqueeState = null;
let suppressNextCanvasClick = false;
let panState = null;

el.svg.addEventListener('mousedown', (e) => {
  // Avoid the native text-selection cursor/highlight that a double-click on the canvas can trigger.
  if (e.detail > 1) e.preventDefault();

  if (e.button === 1) {
    // Middle-mouse-button drag pans the view, regardless of what's under the cursor.
    e.preventDefault();
    panState = { startClientX: e.clientX, startClientY: e.clientY, startPan: { ...state.pan } };
    return;
  }

  if (e.button !== 0 || state.mode === 'link' || e.target !== el.svg) return;
  const { x, y } = clientToGraph(e.clientX, e.clientY);
  marqueeState = { startX: x, startY: y, curX: x, curY: y, moved: false };
});

el.svg.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) {
    const rect = el.svg.getBoundingClientRect();
    const graphPoint = clientToGraph(e.clientX, e.clientY);
    const factor = Math.exp(-e.deltaY * 0.0015);
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, state.zoom * factor));
    state.pan.x = e.clientX - rect.left - graphPoint.x * newZoom;
    state.pan.y = e.clientY - rect.top - graphPoint.y * newZoom;
    state.zoom = newZoom;
    applyPanTransform();
    return;
  }
  state.pan.x -= e.deltaX;
  state.pan.y -= e.deltaY;
  applyPanTransform();
}, { passive: false });

el.svg.addEventListener('dblclick', (e) => {
  e.preventDefault();
  if (e.target === el.svg) {
    const p = clientToGraph(e.clientX, e.clientY);
    addNodeAt(p.x, p.y, e.clientX, e.clientY);
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
// Suppresses the browser's native right-click menu everywhere on the page (not
// just on nodes/edges/folders/tickets, which already open a custom menu here) —
// this always wins since it's on document and every other contextmenu handler
// fires first and bubbles up to it.
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
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
        pushUndo();
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
        pushUndo();
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
      label: edge.label ? 'Modifica etichetta' : 'Aggiungi etichetta',
      icon: 'tag',
      action: () => openEdgeLabelForm(edge, e.clientX, e.clientY),
    },
    {
      label: 'Elimina collegamento',
      icon: 'trash',
      danger: true,
      action: () => {
        pushUndo();
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
  const { x, y } = clientToGraph(e.clientX, e.clientY);
  const hasStart = state.graph.nodes.some((n) => n.nodeType === 'start');
  const hasEnd = state.graph.nodes.some((n) => n.nodeType === 'end');
  showContextMenu(e.clientX, e.clientY, [
    { label: 'Aggiungi nodo qui', icon: 'plus', action: () => addNodeAt(x, y, e.clientX, e.clientY) },
    { label: 'Aggiungi nodo condizionale qui', icon: 'gitBranch', action: () => addNodeAt(x, y, e.clientX, e.clientY, 'conditional') },
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
        pushUndo();
        state.graph.edges.push({ id: genId(), from: state.linkFirst, to: node.id });
        saveGraph();
      }
      // Stay in link mode after connecting: the second node becomes the first
      // end of the next link, so chaining A→B→C→D takes one click per node
      // instead of re-entering link mode before every single connection.
      state.linkFirst = node.id;
      updateLinkModeUI();
    }
    renderGraph();
    return;
  }
  state.selected = { type: 'node', id: node.id };
  state.multiSelected.clear();
  renderGraph();
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

// Group drag re-renders the whole graph on every position update; coalescing
// those into one render per animation frame (instead of one per raw mousemove,
// which fires faster than the screen can paint) removes the jerkiness a fast
// drag had before, without touching how positions are computed.
let groupDragRenderPending = false;
let groupDragRenderHandle = null;
let groupDragPendingGuide = { x: null, y: null };

function onNodeMouseDown(node, e) {
  if (e.button !== 0) return; // let a middle-click pass through to the canvas-level pan handler
  if (state.mode === 'link') return;
  if (e.detail > 1) e.preventDefault();
  e.stopPropagation(); // don't let this bubble into the marquee-selection mousedown handler

  if (state.multiSelected.size > 1 && state.multiSelected.has(node.id)) {
    const starts = new Map();
    for (const id of state.multiSelected) {
      const n = state.graph.nodes.find((gn) => gn.id === id);
      if (n) starts.set(id, { x: n.x, y: n.y });
    }
    groupDragState = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      starts,
      draggedNodeId: node.id,
      moved: false,
    };
    return;
  }

  if (state.multiSelected.size > 0) {
    state.multiSelected.clear();
    renderGraph();
  }
  const p = clientToGraph(e.clientX, e.clientY);
  dragState = {
    nodeId: node.id,
    offsetX: p.x - node.x,
    offsetY: p.y - node.y,
    moved: false,
  };
}

// Smart alignment guides: while dragging a node with Ctrl/Cmd held, snap its
// center to the x/y of any other node's center once it gets within
// ALIGN_THRESHOLD graph units, and report which coordinate matched so a guide
// line can be drawn for it. Off by default so the guides don't show on every
// drag — only when the user actually asks for alignment help.
const ALIGN_THRESHOLD = 6;

function computeAlignSnap(nodeId, x, y) {
  let bestX = null;
  let bestXDist = ALIGN_THRESHOLD;
  let bestY = null;
  let bestYDist = ALIGN_THRESHOLD;
  for (const other of state.graph.nodes) {
    if (other.id === nodeId) continue;
    const dx = Math.abs(other.x - x);
    if (dx < bestXDist) {
      bestXDist = dx;
      bestX = other.x;
    }
    const dy = Math.abs(other.y - y);
    if (dy < bestYDist) {
      bestYDist = dy;
      bestY = other.y;
    }
  }
  return {
    x: bestX !== null ? bestX : x,
    y: bestY !== null ? bestY : y,
    guideX: bestX,
    guideY: bestY,
  };
}

function renderAlignGuides(guideX, guideY) {
  const viewport = el.svg.querySelector('.graph-viewport');
  if (!viewport) return;
  let group = viewport.querySelector('#align-guides');
  if (!group) {
    group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('id', 'align-guides');
    viewport.appendChild(group);
  } else {
    viewport.appendChild(group); // keep on top after a renderGraph() rebuild
  }
  group.innerHTML = '';
  const SPAN = 4000;
  if (guideX !== null) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('class', 'align-guide');
    line.setAttribute('x1', guideX);
    line.setAttribute('x2', guideX);
    line.setAttribute('y1', -SPAN);
    line.setAttribute('y2', SPAN);
    group.appendChild(line);
  }
  if (guideY !== null) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('class', 'align-guide');
    line.setAttribute('x1', -SPAN);
    line.setAttribute('x2', SPAN);
    line.setAttribute('y1', guideY);
    line.setAttribute('y2', guideY);
    group.appendChild(line);
  }
}

function clearAlignGuides() {
  const stray = el.svg.querySelector('#align-guides');
  if (stray) stray.remove();
}

function nodesOverlapRect(node, rx1, ry1, rx2, ry2) {
  const w = nodeWidth() / 2;
  const h = NODE_HEIGHT / 2;
  return node.x - w < rx2 && node.x + w > rx1 && node.y - h < ry2 && node.y + h > ry1;
}

function updateMarqueeRect() {
  if (!marqueeState) return;
  const viewport = el.svg.querySelector('.graph-viewport');
  if (!viewport) return;
  let rectEl = viewport.querySelector('#marquee-rect');
  if (!rectEl) {
    rectEl = document.createElementNS(SVG_NS, 'rect');
    rectEl.setAttribute('id', 'marquee-rect');
    rectEl.setAttribute('class', 'marquee-rect');
    viewport.appendChild(rectEl);
  } else {
    viewport.appendChild(rectEl); // keep it on top after a renderGraph() rebuild
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
  if (panState) {
    state.pan.x = panState.startPan.x + (e.clientX - panState.startClientX);
    state.pan.y = panState.startPan.y + (e.clientY - panState.startClientY);
    applyPanTransform();
    return;
  }

  if (marqueeState) {
    const p = clientToGraph(e.clientX, e.clientY);
    marqueeState.curX = p.x;
    marqueeState.curY = p.y;
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
    // Movement is free by default; holding Ctrl/Cmd turns on snap-to-other-nodes
    // alignment (with guide lines) — otherwise the guides would show on every
    // drag whether you wanted them or not.
    let guideX = null;
    let guideY = null;
    if (e.ctrlKey || e.metaKey) {
      const draggedStart = groupDragState.starts.get(groupDragState.draggedNodeId);
      if (draggedStart) {
        const snap = computeAlignSnap(groupDragState.draggedNodeId, draggedStart.x + dx, draggedStart.y + dy);
        dx = snap.x - draggedStart.x;
        dy = snap.y - draggedStart.y;
        guideX = snap.guideX;
        guideY = snap.guideY;
      }
    }
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      if (!groupDragState.moved) pushUndo();
      groupDragState.moved = true;
    }
    for (const [id, start] of groupDragState.starts) {
      const n = state.graph.nodes.find((gn) => gn.id === id);
      if (n) {
        n.x = start.x + dx;
        n.y = start.y + dy;
      }
    }
    groupDragPendingGuide = { x: guideX, y: guideY };
    if (!groupDragRenderPending) {
      groupDragRenderPending = true;
      groupDragRenderHandle = requestAnimationFrame(() => {
        groupDragRenderPending = false;
        renderGraph();
        renderAlignGuides(groupDragPendingGuide.x, groupDragPendingGuide.y);
      });
    }
    return;
  }

  if (!dragState) return;
  const node = state.graph.nodes.find((n) => n.id === dragState.nodeId);
  if (!node) return;
  const p = clientToGraph(e.clientX, e.clientY);
  let newX = p.x - dragState.offsetX;
  let newY = p.y - dragState.offsetY;
  let guideX = null;
  let guideY = null;
  if (e.ctrlKey || e.metaKey) {
    const snap = computeAlignSnap(node.id, newX, newY);
    newX = snap.x;
    newY = snap.y;
    guideX = snap.guideX;
    guideY = snap.guideY;
  }
  if (Math.abs(newX - node.x) > 2 || Math.abs(newY - node.y) > 2) {
    if (!dragState.moved) pushUndo();
    dragState.moved = true;
  }
  node.x = newX;
  node.y = newY;
  renderGraph();
  renderAlignGuides(guideX, guideY);
});

el.svg.addEventListener('mouseup', () => {
  if (panState) {
    panState = null;
    return;
  }
  if (marqueeState) {
    if (marqueeState.moved) suppressNextCanvasClick = true;
    marqueeState = null;
    const stray = el.svg.querySelector('#marquee-rect');
    if (stray) stray.remove();
    return;
  }
  if (groupDragState) {
    if (groupDragRenderPending) {
      cancelAnimationFrame(groupDragRenderHandle);
      groupDragRenderPending = false;
      renderGraph();
    }
    if (groupDragState.moved) {
      suppressNextClick = true;
      saveGraph();
    }
    groupDragState = null;
    clearAlignGuides();
    return;
  }
  if (dragState) {
    if (dragState.moved) {
      suppressNextClick = true;
      saveGraph();
    }
    dragState = null;
    clearAlignGuides();
  }
});

el.svg.addEventListener('mouseleave', () => {
  panState = null;
  if (marqueeState) {
    marqueeState = null;
    const stray = el.svg.querySelector('#marquee-rect');
    if (stray) stray.remove();
  }
  if (groupDragState) {
    if (groupDragRenderPending) {
      cancelAnimationFrame(groupDragRenderHandle);
      groupDragRenderPending = false;
      renderGraph();
    }
    if (groupDragState.moved) saveGraph();
    groupDragState = null;
    clearAlignGuides();
  }
  if (dragState) {
    if (dragState.moved) saveGraph();
    dragState = null;
    clearAlignGuides();
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
  el.deleteSelectionBtn.disabled = !state.selected && state.multiSelected.size === 0;
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
    el.svg.appendChild(hint); // outside the panned viewport group, always centered on screen
  }

  // Everything graph-related lives in this panned group so the whole canvas can be
  // scrolled when the graph is wider/taller than what's visible.
  const viewport = document.createElementNS(SVG_NS, 'g');
  viewport.setAttribute('class', 'graph-viewport');
  viewport.setAttribute('transform', graphTransformString());
  el.svg.appendChild(viewport);

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
    viewport.appendChild(line);

    if (edge.label) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const bg = document.createElementNS(SVG_NS, 'rect');
      const w = Math.max(24, edge.label.length * 6.5 + 10);
      bg.setAttribute('x', midX - w / 2);
      bg.setAttribute('y', midY - 9);
      bg.setAttribute('width', w);
      bg.setAttribute('height', 18);
      bg.setAttribute('rx', 5);
      bg.setAttribute('class', 'edge-label-bg');
      bg.style.pointerEvents = 'none';
      viewport.appendChild(bg);
      const labelEl = document.createElementNS(SVG_NS, 'text');
      labelEl.setAttribute('x', midX);
      labelEl.setAttribute('y', midY);
      labelEl.setAttribute('class', 'edge-label-text');
      labelEl.textContent = edge.label;
      viewport.appendChild(labelEl);
    }
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
      if (state.mode !== 'link' && state.multiSelected.size > 0) {
        // A plain click (no drag) on a node that's part of an active multi-selection
        // just clears the selection, instead of silently toggling "done" on whichever
        // single node happened to be under the cursor.
        state.multiSelected.clear();
        renderGraph();
        return;
      }
      onNodeClick(node);
    });
    rect.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (state.mode === 'link') return;
      editNode(node, e.clientX, e.clientY);
    });
    rect.addEventListener('contextmenu', (e) => onNodeContextMenu(node, e));
    if (node.label.length > NODE_LABEL_MAX_CHARS) {
      const titleEl = document.createElementNS(SVG_NS, 'title');
      titleEl.textContent = node.label;
      rect.appendChild(titleEl);
    }
    group.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', node.x);
    text.setAttribute('y', node.y);
    text.setAttribute(
      'class',
      'node-label' + (node.done ? ' done' : '') + (LOCKED_TITLE_NODE_TYPES.has(node.nodeType) ? ' locked' : '')
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

    viewport.appendChild(group);
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
