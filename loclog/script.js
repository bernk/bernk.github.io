// ============ State ============
const STORAGE_KEYS = {
  locations: 'loclog_locations',
  log: 'loclog_log'
};

let locations = [];
let locationLog = [];

// ============ Storage ============
function loadLocations() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.locations);
    locations = data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load locations:', e);
    locations = [];
  }
}

function saveLocations() {
  try {
    localStorage.setItem(STORAGE_KEYS.locations, JSON.stringify(locations));
  } catch (e) {
    console.error('Failed to save locations:', e);
  }
}

function loadLog() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.log);
    locationLog = data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load log:', e);
    locationLog = [];
  }
}

function saveLog() {
  try {
    localStorage.setItem(STORAGE_KEYS.log, JSON.stringify(locationLog));
  } catch (e) {
    console.error('Failed to save log:', e);
  }
}

// ============ Navigation ============
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));

  document.getElementById(screenId + '-screen').classList.add('active');
  document.querySelector(`nav button[data-screen="${screenId}"]`).classList.add('active');

  // Re-render on screen switch
  if (screenId === 'main') renderMainScreen();
  if (screenId === 'manage') renderManageScreen();
  if (screenId === 'log') renderLogScreen();
}

// ============ Main Screen ============
function renderMainScreen() {
  const grid = document.getElementById('locations-grid');
  const empty = document.getElementById('main-empty');

  if (locations.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  grid.style.display = '';
  empty.style.display = 'none';

  grid.innerHTML = locations.map((loc, i) => `
    <button class="location-btn" data-index="${i}" aria-label="Log arrival at ${loc}">
      ${escapeHtml(loc)}
    </button>
  `).join('');
}

function logLocation(locationIndex) {
  const location = locations[locationIndex];
  if (!location) return;

  const now = new Date();
  const isoDate = now.toISOString().split('T')[0];
  // const localTime = now.toLocaleTimeString();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const time24Hour = `${hours}:${minutes}`;

  // const entry = `ARRIVED at ${location} on ${isoDate} ${localTime}`;
  const entry = `${isoDate} ${time24Hour} ${location}`;

  locationLog.unshift(entry); // newest first
  saveLog();

  showToast(`Logged: ${location}`);
}

// ============ Manage Screen ============
function renderManageScreen() {
  const list = document.getElementById('manage-list');
  const empty = document.getElementById('manage-empty');

  if (locations.length === 0) {
    list.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  list.style.display = '';
  empty.style.display = 'none';

  list.innerHTML = locations.map((loc, i) => `
    <li class="manage-item" data-index="${i}">
      <div class="reorder-btns">
        <button class="move-up" ${i === 0 ? 'disabled' : ''} aria-label="Move up">&#9650;</button>
        <button class="move-down" ${i === locations.length - 1 ? 'disabled' : ''} aria-label="Move down">&#9660;</button>
      </div>
      <input type="text" class="location-name" value="${escapeHtml(loc)}" maxlength="50" aria-label="Location name">
      <button class="delete-btn" aria-label="Delete ${loc}">&times;</button>
    </li>
  `).join('');
}

function addLocation(name) {
  const trimmed = name.trim();
  if (!trimmed) return;

  locations.push(trimmed);
  saveLocations();
  renderManageScreen();
}

function deleteLocation(index) {
  if (index < 0 || index >= locations.length) return;

  const name = locations[index];
  if (confirm(`Delete "${name}"?`)) {
    locations.splice(index, 1);
    saveLocations();
    renderManageScreen();
  }
}

function renameLocation(index, newName) {
  const trimmed = newName.trim();
  if (!trimmed || index < 0 || index >= locations.length) return;

  locations[index] = trimmed;
  saveLocations();
}

function moveLocation(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= locations.length) return;

  [locations[index], locations[newIndex]] = [locations[newIndex], locations[index]];
  saveLocations();
  renderManageScreen();
}

// ============ Log Screen ============
function renderLogScreen() {
  const list = document.getElementById('log-list');
  const empty = document.getElementById('log-empty');

  if (locationLog.length === 0) {
    list.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  list.style.display = '';
  empty.style.display = 'none';

  list.innerHTML = locationLog.map(entry => `
    <li>${escapeHtml(entry)}</li>
  `).join('');
}

function clearLog() {
  if (locationLog.length === 0) return;

  if (confirm('Clear all logs?')) {
    locationLog = [];
    saveLog();
    renderLogScreen();
  }
}

// ============ Toast ============
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// ============ Utilities ============
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============ Event Listeners ============
function initEventListeners() {
  // Navigation
  document.querySelector('nav').addEventListener('click', (e) => {
    if (e.target.matches('button[data-screen]')) {
      showScreen(e.target.dataset.screen);
    }
  });

  // Main screen - log arrivals (event delegation)
  document.getElementById('locations-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.location-btn');
    if (btn) {
      logLocation(parseInt(btn.dataset.index, 10));
    }
  });

  // Manage screen - add location
  document.getElementById('new-location-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const input = e.target;
      addLocation(input.value);
      input.value = '';
    }
  });

  // Manage screen - delete, rename, reorder (event delegation)
  document.getElementById('manage-list').addEventListener('click', (e) => {
    const item = e.target.closest('.manage-item');
    if (!item) return;

    const index = parseInt(item.dataset.index, 10);

    if (e.target.matches('.delete-btn')) {
      deleteLocation(index);
    } else if (e.target.matches('.move-up')) {
      moveLocation(index, -1);
    } else if (e.target.matches('.move-down')) {
      moveLocation(index, 1);
    }
  });

  document.getElementById('manage-list').addEventListener('change', (e) => {
    if (e.target.matches('.location-name')) {
      const item = e.target.closest('.manage-item');
      const index = parseInt(item.dataset.index, 10);
      renameLocation(index, e.target.value);
    }
  });

  // Log screen - clear
  document.getElementById('clear-log-btn').addEventListener('click', clearLog);
}

// ============ Init ============
function init() {
  loadLocations();
  loadLog();
  initEventListeners();
  renderMainScreen();
}

document.addEventListener('DOMContentLoaded', init);

// ============ Wake Lock ============
// Request a wake lock
let wakeLock = null;

const requestWakeLock = async () => {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('Wake Lock is active!');
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
};

// Release the wake lock (when the page is hidden, for example)
const releaseWakeLock = async () => {
  if (!wakeLock) return;
  await wakeLock.release();
  wakeLock = null;
  console.log('Wake Lock is released!');
};

// Add an event listener to request the wake lock when the user interacts with the app
// document.addEventListener('visibilitychange', () => {
//   if (document.visibilityState === 'visible') {
//     requestWakeLock();
//   }
// });

// Initial request (needs user interaction, e.g., a button click, to work reliably)
// A common practice is to call this function after a user-initiated event like 'touchstart'
document.addEventListener('touchstart', requestWakeLock, { once: true });
