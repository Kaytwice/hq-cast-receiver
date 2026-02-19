const NAMESPACE = 'urn:x-cast:com.example.heroquestcompanion.dungeon';

const partyNameEl = document.getElementById('partyName');
const statusEl = document.getElementById('status');
const listEl = document.getElementById('list');

statusEl.textContent = 'receiver.js geladen ✅';

// Fehler direkt im UI anzeigen
window.addEventListener('error', (e) => {
  statusEl.textContent = 'JS Fehler: ' + (e?.message || 'unknown');
});

function escapeHtml(s) {
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

function avatarSrc(row) {
  if (row.avatarUrl) return row.avatarUrl;
  if (row.avatarBase64) {
    return row.avatarBase64.startsWith('data:')
      ? row.avatarBase64
      : `data:image/png;base64,${row.avatarBase64}`;
  }
  return '';
}

function applyDensityMode(rows) {
  const heroCount = rows.filter(r => !(r.type === 'ZARGON' || r.id === 'ZARGON')).length;
  document.body.classList.remove('compact', 'ultra');
  if (heroCount >= 8) document.body.classList.add('ultra');
  else if (heroCount >= 7) document.body.classList.add('compact');
}

function render(model) {
  partyNameEl.textContent = model.partyName || 'Party';
  statusEl.textContent = 'Verbunden ✅';

  listEl.innerHTML = '';

  const rows = Array.isArray(model.rows) ? model.rows : [];
  applyDensityMode(rows);

  let displayIndex = 1;

  rows.forEach((r) => {
    if (r.type === 'ZARGON' || r.id === 'ZARGON') {
      const z = document.createElement('div');
      z.className = 'zargon';
      z.textContent = 'ZARGON';
      listEl.appendChild(z);
      return;
    }

    const rowEl = document.createElement('div');
    rowEl.className = 'row' + (r.selected ? ' selected' : '');

    const src = avatarSrc(r);
    const name = escapeHtml(r.name ?? '');
    const sub = escapeHtml(r.subtitle ?? '');

    rowEl.innerHTML = `
      <div class="pos">${displayIndex}</div>
      <img class="avatar" ${src ? `src="${src}"` : ''} />
      <div class="info">
        <div class="name">${name}</div>
        ${sub ? `<div class="sub">${sub}</div>` : ``}
      </div>
      <div class="vals">
        <div class="val"><span class="coin"></span><span>${Number(r.gold || 0)}</span></div>
        <div class="val"><span class="coin"></span><span>${Number(r.loot || 0)}</span></div>
      </div>
    `;
    listEl.appendChild(rowEl);
    displayIndex++;
  });
}

// ✅ CAF kann manchmal „zu früh“ referenziert werden → wir warten aktiv
function waitForCastFramework(tries = 60) {
  if (window.cast && cast.framework && cast.framework.CastReceiverContext) return true;
  if (tries <= 0) return false;
  return new Promise((resolve) => setTimeout(resolve, 250)).then(() => waitForCastFramework(tries - 1));
}

(async () => {
  statusEl.textContent = 'Warte auf Cast SDK…';

  const ok = await waitForCastFramework();
  if (!ok) {
    statusEl.textContent = 'Cast SDK nicht geladen ❌';
    return;
  }

  statusEl.textContent = 'Cast SDK ok ✅';

  const ctx = cast.framework.CastReceiverContext.getInstance();

  ctx.addCustomMessageListener(NAMESPACE, (event) => {
    let data = event.data;

    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { return; }
    }

    if (data && data.type === 'DUNGEON_VIEW') {
      render(data);
    }
  });

  ctx.start();
  statusEl.textContent = 'Receiver gestartet ✅ (warte auf Daten)';
})();