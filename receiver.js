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
  // Prefer URL, fallback to base64
  if (row.avatarUrl) return row.avatarUrl;
  if (row.avatarBase64) {
    // allow sending raw base64 without prefix
    const b64 = row.avatarBase64.startsWith('data:') ? row.avatarBase64 : `data:image/png;base64,${row.avatarBase64}`;
    return b64;
  }
  return ''; // empty -> shows background
}

function render(model) {
  partyNameEl.textContent = model.partyName || 'Party';
  statusEl.textContent = 'Verbunden ✅';

  listEl.innerHTML = '';

  const rows = Array.isArray(model.rows) ? model.rows : [];
  rows.forEach((r, idx) => {
    // optional: show Zargon block if your sender includes it as a special row
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
      <div class="pos">${idx + 1}</div>
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
  });
}

const ctx = cast.framework.CastReceiverContext.getInstance();
ctx.start();

ctx.addCustomMessageListener(NAMESPACE, (event) => {
  const data = event.data;
  if (data && data.type === 'DUNGEON_VIEW') {
    render(data);
  }
});
