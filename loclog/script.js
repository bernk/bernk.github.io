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

// ============ Log Screen ============
function renderMainScreen() {
  const grid = document.getElementById('locations-grid');
  const empty = document.getElementById('main-empty');

  // Always show grid (manual button is always available)
  grid.style.display = '';
  empty.style.display = 'none';

  const manualButton = `
    <button class="location-btn manual-btn" id="manual-entry-btn" aria-label="Manual entry">
      Manual Entry
    </button>
  `;

  const locationButtons = locations.map((loc, i) => `
    <button class="location-btn" data-index="${i}" aria-label="Log arrival at ${loc}">
      ${escapeHtml(loc)}
    </button>
  `).join('');

  grid.innerHTML = manualButton + locationButtons;
}

function logLocation(locationIndex) {
  const location = locations[locationIndex];
  if (!location) return;

  const now = new Date();

  const year = now.getFullYear();
  const monthCorrected = now.getMonth()+1;
  const month = monthCorrected.toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const yyyymmdd = `${year}-${month}-${day}`;

  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const displayTime = `${hours}:${minutes}`;
  const roundedTime = roundTime(now.getHours(),now.getMinutes());

  const entry = {
    locationDate: yyyymmdd, 
    locationTime: {displayTime, roundedTime}, 
    locationName: location
  };

  console.log(entry);

  locationLog.push(entry); // add to end of locationLog array
  saveLog();

  showToast(`Logged: ${location}`);
}

function logManualEntry(name) {
  const trimmed = name.trim();
  if (!trimmed) return;

  const now = new Date();

  const year = now.getFullYear();
  const monthCorrected = now.getMonth() + 1;
  const month = monthCorrected.toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const yyyymmdd = `${year}-${month}-${day}`;

  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const displayTime = `${hours}:${minutes}`;
  const roundedTime = roundTime(now.getHours(), now.getMinutes());

  const entry = {
    locationDate: yyyymmdd,
    locationTime: { displayTime, roundedTime },
    locationName: trimmed
  };

  locationLog.push(entry);
  saveLog();

  showToast(`Logged: ${trimmed}`);
}

function showManualInput() {
  const overlay = document.getElementById('manual-card-overlay');
  const input = document.getElementById('manual-input');
  overlay.classList.add('show');
  input.value = '';
  input.focus();
}

function hideManualInput() {
  const overlay = document.getElementById('manual-card-overlay');
  overlay.classList.remove('show');
}

// ============ Quick Logs Screen ============
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

// ============ Logbook Screen ============
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

  list.innerHTML = locationLog.toReversed().map(entry => `
    <div class='log-list-entry'>
        <span class='log-date'>${escapeHtml(entry.locationDate.slice(8,10))}</span>
        <span class='log-time'>${escapeHtml(entry.locationTime.displayTime)}</span>
        <span class='log-name'>${escapeHtml(entry.locationName)}</span>
    </div>
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

function clearLastLog() {
  if (locationLog.length === 0) return;

  if (confirm('Clear last log?')) {
    locationLog.pop();
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

function roundTime(hours, minutes) {
  // Takes two integers
  const totalMinutes = hours * 60 + minutes;
  const rounded = Math.round(totalMinutes / 5) * 5;
  const newHours = Math.floor(rounded / 60) % 24;
  const newMinutes = rounded % 60;
  return String(newHours).padStart(2, '0') + String(newMinutes).padStart(2, '0');
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
    // Handle manual entry button
    if (e.target.matches('#manual-entry-btn')) {
      showManualInput();
      return;
    }

    // Handle location buttons
    const btn = e.target.closest('.location-btn');
    if (btn && btn.dataset.index !== undefined) {
      logLocation(parseInt(btn.dataset.index, 10));
    }
  });

  // Manual entry card
  document.getElementById('manual-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      logManualEntry(e.target.value);
      hideManualInput();
    } else if (e.key === 'Escape') {
      hideManualInput();
    }
  });

  document.getElementById('manual-submit-btn').addEventListener('click', () => {
    const manualEntryValue =  document.getElementById('manual-input').value;
    logManualEntry(manualEntryValue);
    addLocation(manualEntryValue);
    renderMainScreen();
    hideManualInput();
  });

  document.getElementById('manual-card-overlay').addEventListener('click', (e) => {
    if (e.target.matches('.manual-card-overlay')) {
      hideManualInput();
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
  document.getElementById('clear-last-log-btn').addEventListener('click', clearLastLog);
}

// ============ Init ============
function init() {
  loadLocations();
  loadLog();
  initEventListeners();
  renderMainScreen();
}

document.addEventListener('DOMContentLoaded', init);
