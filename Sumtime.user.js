// ==UserScript==
// @name         Sumtime
// @namespace    https://mercury.networkroads.net/
// @version      1.2
// @description  Shows decimal hour difference between first and last log entry times in #logform
// @match        https://mercury.networkroads.net/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // --- Core logic ---
  function parseTime(val) {
    const t = val.trim().replace(":", "").padStart(4, "0");
    if (!val.trim()) return null; // blank input
    const h = parseInt(t.slice(0, 2), 10);
    const m = parseInt(t.slice(2), 10);
    if (isNaN(h) || isNaN(m) || h > 23 || m > 59) return null;
    return h + m / 60;
  }

  function getTimes() {
    const rows = Array.from(document.querySelectorAll("#logform .form-row"));
    if (rows.length < 2) return null;

    // Collect all valid times in order
    const times = [];
    for (const row of rows) {
      const input = row.querySelector("input.form-control");
      const t = parseTime(input?.value || input?.getAttribute("value") || "");
      if (t !== null) times.push(t);
    }
    if (times.length < 2) return null;

    // Split into days at each midnight crossing
    const days = [];
    let dayStart = times[0];
    let prev = times[0];
    for (let i = 1; i < times.length; i++) {
      if (times[i] < prev) {
        // Day ends at midnight: push time from dayStart to midnight
        days.push(Math.round((24 - dayStart) * 4) / 4);
        // Next day starts fresh from midnight (0)
        dayStart = 0;
      }
      prev = times[i];
    }
    // Last (or only) day
    days.push(Math.round((prev - dayStart) * 4) / 4);

    const total = Math.round(days.reduce((a, b) => a + b, 0) * 4) / 4;
    return { total, days };
  }

  // --- Styles ---
  const style = document.createElement("style");
  style.textContent = `
    #sumtime-widget {
      display: none;
      align-items: stretch;
      gap: 8px;
      margin-top: 4px;
      margin-bottom: 4px;
      font-size: 1rem;
    }
    #sumtime-widget .st-value {
      flex: 0 0 auto;
      padding: 6px 0 6px 12px;
      background: #fff;
      border-radius: 4px;
      font-weight: 600;
      color: #212529;
    }
    #sumtime-widget .st-label {
      flex: 1 1 auto;
      padding: 6px 0;
      background: #fff;
      border-radius: 4px;
      color: #6c757d;
      font-style: italic;
    }    
  `;
  document.head.appendChild(style);

  // --- Widget ---
  const widget = document.createElement("div");
  widget.id = "sumtime-widget";
  widget.innerHTML = `
    <div class="st-value" id="st-value">—</div>
    <div class="st-label" id="st-label">trip total</div>
  `;

  function updateWidget() {
    const valueEl  = document.getElementById("st-value");
    const labelEl  = document.getElementById("st-label");
    const result   = getTimes();

    if (!result) {
      valueEl.textContent = "—";
      labelEl.textContent = "trip total";
      return;
    }

    if (result.days.length === 1) {
      // Single day — simple display
      valueEl.textContent = result.total + " h";
      labelEl.textContent = "trip total";
    } else {
      // Multi-day — show total and per-day breakdown
      const breakdown = result.days.map((d, i) => `${d} h`).join("  ·  ");
      valueEl.textContent = result.total + " h";
      labelEl.textContent = breakdown;
    }
  }

  // --- Debounce ---
  let debounceTimer;
  function debouncedUpdate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateWidget, 150);
  }

  // --- Attach: wait for #logform, then inject widget as last child ---
  function attachObserver() {
    const logform = document.getElementById("logform");
    if (!logform) {
      const bodyObserver = new MutationObserver(() => {
        if (document.getElementById("logform")) {
          bodyObserver.disconnect();
          attachObserver();
        }
      });
      bodyObserver.observe(document.body, { childList: true, subtree: true });
      return;
    }

    logform.insertAdjacentElement("afterend", widget);
    widget.style.display = "flex";
    updateWidget();

    const observer = new MutationObserver(debouncedUpdate);
    observer.observe(logform, { subtree: true, childList: true, attributes: true, attributeFilter: ["value"] });
  }

  attachObserver();
  document.addEventListener("input",  debouncedUpdate, true);
  document.addEventListener("change", debouncedUpdate, true);
})();