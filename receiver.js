const NAMESPACE = 'urn:x-cast:com.example.heroquestcompanion.dungeon';

const partyNameEl = document.getElementById('partyName');
const statusEl = document.getElementById('status');
const listEl = document.getElementById('list');

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
    const b64 = row.avatarBase64.startsWith('data:')
      ? row.avatarBase64
      : `data:image/png;base64,${row.avatarBase64}`;
    return b64;
  }
  return '';
}

function applyDensityMode(rows) {
  // Zähle nur "echte" Helden, Zargon nicht
  const heroCount = rows.filter(r => !(r.type === 'ZARGON' || r.id === 'ZARGON')).length;

  document.body.classList.remove('compact', 'ultra');

  // Schwellenwerte kannst du easy anpassen:
  // <=6 normal, 7-8 compact, >=9 ultra
  if (heroCount >= 9) document.body.classList.add('ultra');
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
    // Zargon Block
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

const ctx = cast.framework.CastReceiverContext.getInstance();

// ✅ Listener VOR start() + JSON.parse falls Android String sendet
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
