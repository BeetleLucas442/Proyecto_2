/* app.js — screens and navigation (hash routes). No changes needed to connect the database. */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CATEGORIES = { concert: 'Conciertos', theater: 'Obra de teatro', sports: 'Eventos deportivos' };
const TYPES = { user: 'Usuario', organizer: 'Organizador', admin: 'Administrador', superadmin: 'Administrador de Nyxa' };
const STATUSES = { active: 'Activo', inactive: 'Inactivo' };
const ADMIN_NOTICE = 'Para dar permisos de administrador nos pondremos en contacto contigo para comprobar que eres una persona con un negocio de este estilo y así evitar problemas.';
const AUTH_PAGES = ['login', 'register', 'recover'];
const view = $('#view');
const todayLabel = (() => { const d = new Date(); return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`; })();
const todayISO = new Date().toLocaleDateString('en-CA');
const formatDate = d => (d || '').split('-').reverse().join('/');
const canManage = u => ['admin', 'organizer', 'superadmin'].includes(u?.type); // can create events
// Delete: only the Nyxa administrator (the person who runs the site) can delete any event; admins/organizers only their own
const canDelete = (u, e) => u?.type === 'superadmin' || (canManage(u) && e.isMine);
let flash = ''; // one-time message shown on the profile screen

/* ---------- Dialogs (alert/confirm/prompt are blocked inside embedded pages, so we use our own) ---------- */
function openModal(html) { const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="modal-box">${html}</div>`; document.body.append(m); return m; }
const confirmBox = text => new Promise(resolve => {
  const m = openModal(`<p>${esc(text)}</p><div class="modal-actions"><button class="btn ghost" data-r="0">Cancelar</button><button class="btn" data-r="1">Aceptar</button></div>`);
  m.onclick = e => { const b = e.target.closest('[data-r]'); if (b) { m.remove(); resolve(b.dataset.r === '1'); } };
});
const reviewBox = () => new Promise(resolve => {
  const m = openModal(`<h3>Agregar reseña</h3><textarea id="review-text" rows="4" placeholder="Escribe tu reseña"></textarea><label>Calificación <select id="review-stars">${[5, 4, 3, 2, 1].map(n => `<option>${n}</option>`).join('')}</select></label><div class="modal-actions"><button class="btn ghost" data-r="0">Cancelar</button><button class="btn" data-r="1">Publicar</button></div>`);
  m.onclick = e => { const b = e.target.closest('[data-r]'); if (!b) return; const text = $('#review-text').value.trim();
    if (b.dataset.r === '1' && !text) return; m.remove(); resolve(b.dataset.r === '1' ? { text, stars: +$('#review-stars').value } : null); };
});
function toast(text) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; document.body.append(t); setTimeout(() => t.remove(), 3500); }

/* ---------- Reusable pieces ---------- */
const banner = (key, title = '', extra = '', image = '') => `<section class="banner ${title ? 'cat' : ''} bg-${key}" ${image ? `style="background-image:linear-gradient(to top,#0009,transparent 55%),url('${esc(image)}')"` : ''}><span class="date">${todayLabel}</span>${title ? `<h1>${esc(title)}</h1>` : ''}${extra}</section>`;
const band = text => `<div class="band">${esc(text)}</div>`;
const addCard = label => `<div class="add admin-only" data-go="#/create"><div class="plus">+</div>${label}</div>`;
const imageStyle = e => e.image ? `style="background-image:url('${esc(e.image)}')"` : '';
const field = (icon, name, placeholder, type = 'text') => `<div class="field"><span>${icon}</span><input name="${name}" type="${type}" placeholder="${placeholder}" required></div>`;
const avatar = (photo, id = '') => `<div class="big-avatar" ${id ? `id="${id}"` : ''} ${photo ? `style="background-image:url('${esc(photo)}')"` : ''}>${photo ? '' : '👤'}</div>`;

const card = e => {
  const owned = e.purchased || e.isMine;
  return `<article class="card"><div class="img cat-${esc(e.category)}" ${imageStyle(e)} data-open="${e.id}"></div><div class="info">
    <h3 data-open="${e.id}">${esc(CATEGORIES[e.category] || 'Evento')}</h3><div>Título: ${esc(e.title)}</div><div>${esc((e.description || '').slice(0, 130))}</div>
    <div>Fecha: ${formatDate(e.date)}</div><div>Lugar del encuentro: ${esc(e.venue)}<br>Dirección: ${esc(e.address)}</div>
    ${owned ? '<button class="btn owned" data-go="#/my-events">Ver en tus Eventos</button>' : `<button class="btn" data-buy="${e.id}">COMPRAR</button>`}
    ${canDelete(Session.get(), e) ? `<button class="btn del" data-del="${e.id}">Eliminar</button>` : ''}</div></article>`;
};
const eventGrid = (events, addLabel) => `<div class="grid">${events.map(card).join('') || '<p class="empty">Aún no hay eventos.</p>'}${addCard(addLabel)}</div>`;

/* Photo cropper: drag to move, slider / mouse wheel / pinch to zoom. Resolves { data, state } or null when cancelled.
   `state` ({ zoom, ox, oy }) lets the next adjustment start where the user left off. */
function cropPhoto({ src, round, aspect, outW, start }) {
  return new Promise(resolve => {
    const m = openModal(`<h3>Acomoda tu foto</h3><p class="crop-hint">Arrastra la foto para moverla y usa el control para acercarla o alejarla.</p>
      <div class="crop-frame ${round ? 'round' : ''}" style="aspect-ratio:${aspect}"><img alt="" draggable="false"></div>
      <label class="crop-zoom">Zoom <input type="range" id="crop-zoom" min="1" max="4" step="0.01" value="1"></label>
      <div class="modal-actions"><button class="btn ghost" data-r="0">Cancelar</button><button class="btn" data-r="1">Guardar foto</button></div>`);
    const frame = m.querySelector('.crop-frame'), img = frame.querySelector('img'), zoomInput = m.querySelector('#crop-zoom');
    const clamp = z => Math.min(4, Math.max(1, z));
    let fw, fh, base, zoom = start?.zoom || 1, ox = start?.ox || 0, oy = start?.oy || 0; // ox/oy: offset of the image center from the frame center
    const size = () => [img.naturalWidth * base * zoom, img.naturalHeight * base * zoom];
    const apply = () => {
      const [w, h] = size(), mx = Math.max(0, (w - fw) / 2), my = Math.max(0, (h - fh) / 2);
      ox = Math.min(mx, Math.max(-mx, ox)); oy = Math.min(my, Math.max(-my, oy)); // the photo must always cover the frame
      Object.assign(img.style, { width: w + 'px', height: h + 'px', left: (fw / 2 + ox - w / 2) + 'px', top: (fh / 2 + oy - h / 2) + 'px' });
      zoomInput.value = zoom;
    };
    const setZoom = z => { z = clamp(z); ox *= z / zoom; oy *= z / zoom; zoom = z; apply(); }; // zooms around the frame center
    img.onload = () => { fw = frame.clientWidth; fh = frame.clientHeight; base = Math.max(fw / img.naturalWidth, fh / img.naturalHeight); apply(); };
    if (/^https?:/.test(src)) img.crossOrigin = 'anonymous';
    img.src = src;

    const pointers = new Map(); let lastDist = 0;
    frame.onpointerdown = e => { frame.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); lastDist = 0; frame.classList.add('drag'); };
    frame.onpointermove = e => {
      const prev = pointers.get(e.pointerId); if (!prev) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) { ox += e.clientX - prev.x; oy += e.clientY - prev.y; apply(); }
      else if (pointers.size === 2) { const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (lastDist) setZoom(zoom * d / lastDist); lastDist = d; }
    };
    frame.onpointerup = frame.onpointercancel = e => { pointers.delete(e.pointerId); lastDist = 0; if (!pointers.size) frame.classList.remove('drag'); };
    frame.onwheel = e => { e.preventDefault(); setZoom(zoom * (e.deltaY < 0 ? 1.08 : 0.92)); };
    zoomInput.oninput = () => setZoom(+zoomInput.value);

    m.onclick = e => {
      const b = e.target.closest('[data-r]'); if (!b) return;
      let result = null;
      if (b.dataset.r === '1') {
        const k = outW / fw, [w, h] = size(), canvas = document.createElement('canvas');
        canvas.width = outW; canvas.height = Math.round(fh * k);
        try { canvas.getContext('2d').drawImage(img, (fw / 2 + ox - w / 2) * k, (fh / 2 + oy - h / 2) * k, w * k, h * k);
          result = { data: canvas.toDataURL('image/jpeg', .85), state: { zoom, ox, oy } }; }
        catch (err) { toast('No se pudo procesar la foto.'); return; }
      }
      m.remove(); resolve(result);
    };
  });
}

/* Photo upload: pick a file, adjust it in the cropper and store the result as a dataURL in the hidden input `name`.
   `outW` is the width in pixels of the saved image. Profile photos are square (shown round), event photos are 13:8 like the cards. */
const photoField = (value, name = 'photo', rect = false) => `<div class="photo-box">${rect ? `<div id="preview" class="prev-rect" ${value ? `style="background-image:url('${esc(value)}')"` : ''}>${value ? '' : 'Sin foto'}</div>` : avatar(value, 'preview')}
  <input type="hidden" name="${name}" value="${esc(value || '')}"><input type="file" id="file" accept="image/*" hidden>
  <div class="photo-actions"><button type="button" class="btn" id="btn-photo">${rect ? 'Subir foto del evento' : 'Subir foto'}</button><button type="button" class="btn ghost" id="btn-adjust" ${value ? '' : 'hidden'}>Ajustar foto</button></div></div>`;
function photoPicker(form, name = 'photo', outW = 320) {
  const file = form.querySelector('#file'), preview = form.querySelector('#preview'), adjust = form.querySelector('#btn-adjust');
  const round = !preview.classList.contains('prev-rect');
  let source = null, state = null; // source: image shown in the cropper; state: last zoom/position
  const edit = async src => {
    const r = await cropPhoto({ src, round, aspect: round ? 1 : 13 / 8, outW, start: state }); if (!r) return;
    source = src; state = r.state; form[name].value = r.data;
    preview.style.backgroundImage = `url('${r.data}')`; preview.textContent = ''; adjust.hidden = false;
  };
  form.querySelector('#btn-photo').onclick = () => file.click();
  adjust.onclick = () => edit(source || form[name].value);
  file.onchange = () => {
    const f = file.files[0]; file.value = ''; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { const img = new Image(); img.onload = () => { // keep the original at a sensible size
      const k = Math.min(1, 1600 / Math.max(img.width, img.height)), canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * k); canvas.height = Math.round(img.height * k); canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      state = null; edit(canvas.toDataURL('image/jpeg', .9)); }; img.src = reader.result; };
    reader.readAsDataURL(f);
  };
}
const adminMessage = user => ADMIN_NOTICE + (canManage(user) ? ' (Modo de pruebas: ya tienes acceso de administrador.)' : '');

/* ---------- Screens ---------- */
const screens = {
  async login() {
    document.body.classList.add('no-shell');
    view.innerHTML = `<form id="f" class="form-card"><div class="pic">👤</div>${field('@', 'identifier', 'Correo electrónico / Nombre de usuario')}${field('🔒', 'password', 'Contraseña', 'password')}
      <div class="links"><a data-go="#/recover">Restablecer Contraseña</a><a data-go="#/register">Registrarse</a></div><button class="btn">Iniciar sesión</button><div class="msg"></div></form>`;
    $('#f').onsubmit = async ev => { ev.preventDefault(); const d = Object.fromEntries(new FormData(ev.target));
      try { Session.set(await API.login(d.identifier, d.password)); location.hash = '#/home'; } catch (e) { $('.msg').textContent = e.message; } };
  },
  async register() {
    document.body.classList.add('no-shell');
    view.innerHTML = `<form id="f" class="form-card"><div class="pic">👤</div>${field('@', 'email', 'Correo electrónico', 'email')}${field('👤', 'username', 'Nombre de Usuario')}${field('🔒', 'password', 'Contraseña', 'password')}${field('📞', 'phone', 'Teléfono', 'tel')}
      <button class="btn">Registrar</button><a class="link" data-go="#/login">Iniciar sesión</a><div class="msg"></div></form>`;
    $('#f').onsubmit = async ev => { ev.preventDefault(); const d = Object.fromEntries(new FormData(ev.target));
      if (d.password.length < 8 || !/[A-Za-z]/.test(d.password) || !/\d/.test(d.password)) return $('.msg').textContent = 'La contraseña debe tener mínimo 8 caracteres, una letra y un número.';
      try { Session.set(await API.register(d)); location.hash = '#/personal-data'; } catch (e) { $('.msg').textContent = e.message; } };
  },
  async recover() {
    document.body.classList.add('no-shell');
    view.innerHTML = `<form id="f" class="form-card"><div class="pic">🔒</div>${field('@', 'email', 'Correo electrónico', 'email')}<button class="btn">Enviar</button><a class="link" data-go="#/login">Volver</a><div class="msg"></div></form>`;
    $('#f').onsubmit = ev => { ev.preventDefault(); $('.msg').style.color = '#9be29b'; $('.msg').textContent = 'Si el correo existe, recibirás instrucciones.'; /* TODO: password reset API */ };
  },
  async home() {
    view.innerHTML = banner('home') + band('Próximos Eventos') + eventGrid(await API.getEvents(), 'Crear nuevo evento');
  },
  async category(cat) {
    if (!CATEGORIES[cat]) return location.hash = '#/home';
    view.innerHTML = banner(cat, CATEGORIES[cat]) + band('Próximamente') + eventGrid(await API.getEvents(cat), 'Crear nuevo evento');
  },
  async event(id) {
    const e = await API.getEvent(id); if (!e) return view.innerHTML = '<p class="center">Evento no encontrado.</p>';
    const owned = e.purchased || e.isMine, p = e.participants || [], teams = [...new Set(p.map(x => x.team).filter(Boolean))];
    const list = teams.length ? `<div class="cols">${teams.map(t => `<div><b>${esc(t)}</b><ul>${p.filter(x => x.team === t).map(x => `<li>${esc(x.name)} — ${esc(x.role)}</li>`).join('')}</ul></div>`).join('')}</div>`
      : p.length ? `<ul>${p.map(x => `<li><b>${esc(x.role)}:</b> ${esc(x.name)}</li>`).join('')}</ul>` : '';
    const score = e.category === 'sports' ? `<div class="scoreboard"><b>Marcador <span class="dot"></span></b><strong>${esc(e.score || '0/0')}</strong></div>` : '';
    view.innerHTML = banner(e.category, CATEGORIES[e.category], score, e.image) + band(e.title) + `<div class="box round"><b>Descripción:</b><br>${esc(e.description)}</div>
      <div class="box">${list}<p style="margin-top:1rem"><b>Fecha:</b> ${formatDate(e.date)}<br><b>Lugar del encuentro:</b> ${esc(e.venue)}<br><b>Dirección:</b> ${esc(e.address)}</p></div>
      <div class="center">${owned ? '<button class="btn owned lg" data-go="#/my-events">Ver en tus Eventos</button>' : `<button class="btn lg" data-buy="${e.id}">COMPRAR</button>`}</div>`;
  },
  async 'my-events'() {
    view.innerHTML = banner('upcoming') + band('Tus próximos eventos') + eventGrid(await API.getMyEvents(), 'Agregar un evento');
  },
  async attended() {
    const events = await API.getAttended();
    view.innerHTML = banner('attended') + band('Eventos a los que fuiste') + (events.map(e => `<div class="attended"><div class="img cat-${esc(e.category)}" ${imageStyle(e)}></div>
      <div class="reviews"><button class="btn" data-review="${e.id}">Agregar Reseña</button>${(e.reviews || []).map(r => `<div class="u"><i></i>${esc(r.user)}</div><p>${esc(r.text)}</p><div class="stars">${'★'.repeat(r.stars)}</div>`).join('')}</div></div>`).join('') || '<p class="center" style="padding:2rem">Aún no has asistido a eventos.</p>');
  },
  async 'personal-data'() { // shown right after registering
    const u = await API.getProfile();
    view.innerHTML = band('Datos personales') + `<form id="f" class="form-card form-wide"><p style="font-size:.85rem;color:#bbb;margin-bottom:1rem">Completa tu perfil (puedes cambiarlo después).</p>${photoField(u.photo)}
      <label>Nombre completo</label><div class="field"><input name="fullName" value="${esc(u.fullName)}"></div><label>Ciudad</label><div class="field"><input name="city" value="${esc(u.city)}"></div>
      <label>Tipo de cuenta</label><label class="opt"><input type="radio" name="accountType" value="user" checked> <span><b>Usuario normal</b><br>Descubre eventos y compra boletos.</span></label>
      <label class="opt"><input type="radio" name="accountType" value="admin"> <span><b>Administrador</b><br>Publica y gestiona eventos.</span></label><div class="notice" id="notice">${ADMIN_NOTICE}</div>
      <div class="center"><button class="btn lg" style="background:var(--p)">Terminar</button><a class="link" data-go="#/home">Omitir por ahora</a></div><div class="msg"></div></form>`;
    const f = $('#f'); photoPicker(f);
    f.onchange = () => $('#notice').style.display = f.accountType.value === 'admin' ? 'block' : 'none';
    f.onsubmit = async ev => { ev.preventDefault(); const d = Object.fromEntries(new FormData(f)), wantsAdmin = d.accountType === 'admin';
      try { const r = await API.updateProfile({ fullName: d.fullName, city: d.city, photo: d.photo || null, requestAdmin: wantsAdmin }); Session.set({ ...Session.get(), ...r });
        toast(wantsAdmin ? 'Solicitud de administrador enviada. Nos pondremos en contacto contigo.' : '¡Listo! Tu perfil quedó guardado.'); location.hash = '#/home'; }
      catch (e) { $('.msg').textContent = e.message; } };
  },
  async profile() { // read-only user screen
    const u = await API.getProfile(), row = (k, v) => `<dt>${k}</dt> <dd>${esc(v === '' || v == null ? '—' : v)}</dd>`, msg = flash; flash = '';
    view.innerHTML = (msg ? `<div class="notice show">${esc(msg)}</div>` : '') + `<div class="profile">${avatar(u.photo)}<div><dl>${row('Nombre completo', u.fullName)}${row('Nombre de usuario', '@' + u.username)}${row('Correo electrónico', u.email)}${row('Teléfono', u.phone)}${row('Cantidad de eventos asistidos', u.attendedEvents)}<div class="admin-only">${row('Cantidad de eventos creados', u.createdEvents)}</div>${row('Ciudad', u.city)}${row('Estado de la cuenta', STATUSES[u.status])}${row('Tipo de usuario', TYPES[u.type])}${u.adminRequest === 'pending' ? row('Solicitud de administrador', 'pendiente de verificación') : ''}</dl>
      <button type="button" class="btn lg" style="background:var(--p);margin-top:1.2rem" data-go="#/edit">Hacer cambios</button></div></div>`;
  },
  async edit() { // edit screen (also "Ajustes")
    const u = await API.getProfile(), input = (n, l, ro) => `<label>${l}<input name="${n}" value="${esc(u[n])}" ${ro ? 'readonly' : ''} placeholder="Escribe tu ${l.toLowerCase()}"></label>`, canAsk = u.type === 'user' && u.adminRequest !== 'pending';
    view.innerHTML = band('Hacer cambios') + `<form id="f" class="profile">${photoField(u.photo)}<div class="profile-data">${input('fullName', 'Nombre completo')}${input('username', 'Nombre de usuario')}${input('email', 'Correo electrónico', 1)}${input('phone', 'Teléfono')}${input('city', 'Ciudad')}
      <p><b>Tipo de usuario:</b> ${TYPES[u.type]}</p>${canAsk ? `<label class="opt"><input type="checkbox" name="requestAdmin"> <span>Quiero ser administrador (publicar eventos)</span></label><div class="notice" id="notice">${ADMIN_NOTICE}</div>` : ''}
      <button class="btn lg" style="background:var(--p)">Guardar cambios</button><div class="msg"></div></div></form>`;
    const f = $('#f'); photoPicker(f);
    if (canAsk) { const toggle = () => $('#notice').style.display = f.requestAdmin.checked ? 'block' : 'none'; f.requestAdmin.onchange = toggle; toggle(); }
    f.onsubmit = async ev => { ev.preventDefault(); const d = Object.fromEntries(new FormData(f)), m = $('.msg'), wantsAdmin = !!f.requestAdmin?.checked;
      if (!d.username.trim()) { m.style.color = '#ff7a7a'; return m.textContent = 'El nombre de usuario no puede quedar vacío.'; }
      try { const r = await API.updateProfile({ fullName: d.fullName, username: d.username, phone: d.phone, city: d.city, photo: d.photo || null, requestAdmin: wantsAdmin }); Session.set({ ...Session.get(), ...r });
        flash = wantsAdmin ? adminMessage(r) : 'Cambios guardados.'; location.hash = '#/profile'; }
      catch (e) { m.style.color = '#ff7a7a'; m.textContent = e.message; } };
  },
  async create() {
    if (!canManage(Session.get())) return location.hash = '#/home'; // only organizer/admin (RNF-05)
    const input = (n, l, t = 'text', extra = '') => `<label>${l}</label><div class="field"><input name="${n}" type="${t}" ${extra} required></div>`;
    view.innerHTML = band('Crear nuevo evento') + `<form id="f" class="form-card form-wide">${photoField('', 'image', true)}${input('title', 'Título')}<label>Categoría</label><div class="field"><select name="category">${Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <label>Descripción</label><div class="field"><textarea name="description" rows="3" required></textarea></div>${input('date', 'Fecha', 'date', `min="${todayISO}"`)}${input('venue', 'Lugar')}${input('address', 'Dirección')}
      <label>Participantes (uno por línea: Nombre — Rol)</label><div class="field"><textarea name="participants" rows="4"></textarea></div><div class="center"><button class="btn lg" style="background:var(--p)">Publicar</button></div><div class="msg"></div></form>`;
    const f = $('#f'); photoPicker(f, 'image', 900);
    f.onsubmit = async ev => { ev.preventDefault(); const d = Object.fromEntries(new FormData(f));
      d.participants = d.participants.split('\n').filter(Boolean).map(l => { const [name, role] = l.split('—').map(s => s.trim()); return { name, role: role || '' }; });
      d.image = d.image || null;
      try { await API.createEvent(d); toast('Evento publicado'); location.hash = '#/my-events'; } catch (e) { $('.msg').textContent = e.message; } };
  }
};
screens.settings = screens.edit;

/* ---------- Router ---------- */
/* Loading screen: shown on every screen transition. It stays for at least LOADER_MS and until the images of the new
   screen have loaded (but never longer than LOADER_MAX_MS, in case an image is slow or broken). */
const LOADER_MS = 700, LOADER_MAX_MS = 3000, loader = $('#loader');
let loaderTimer = null;
const showLoader = () => { clearTimeout(loaderTimer); loader.classList.remove('hide'); };
const hideLoader = since => { clearTimeout(loaderTimer); loaderTimer = setTimeout(() => loader.classList.add('hide'), Math.max(0, LOADER_MS - (Date.now() - since))); };

/* Resolves when every background image used inside #view has loaded (or failed, or LOADER_MAX_MS passed) */
function imagesReady() {
  const urls = new Set();
  view.querySelectorAll('*').forEach(el => { for (const m of getComputedStyle(el).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)) urls.add(m[1]); });
  const loads = [...urls].map(u => new Promise(done => { const img = new Image(); img.onload = img.onerror = done; img.src = u; }));
  return Promise.race([Promise.all(loads), new Promise(done => setTimeout(done, LOADER_MAX_MS))]);
}

let routeId = 0;
async function route(silent = false) { // silent = refresh the current screen without the loading screen
  const started = Date.now(), id = ++routeId;
  if (!silent) showLoader();
  const [name = '', arg] = location.hash.slice(2).split('/'), page = name || 'home', user = Session.get();
  if (!user && !AUTH_PAGES.includes(page)) return location.hash = '#/login';
  if (user && AUTH_PAGES.includes(page)) return location.hash = '#/home';
  document.body.classList.toggle('is-admin', canManage(user));
  const av = $('#btn-avatar'); av.style.backgroundImage = user?.photo ? `url('${user.photo}')` : ''; av.textContent = user?.photo ? '' : '👤';
  if (user) document.body.classList.remove('no-shell');
  closeMenu();
  try { await (screens[page] || screens.home)(arg); } catch (e) { view.innerHTML = `<p class="center" style="padding:3rem">No se pudo cargar: ${esc(e.message)}</p>`; }
  scrollTo(0, 0);
  await imagesReady();
  if (id === routeId) hideLoader(silent ? 0 : started); // a newer route keeps control of the loader
}
const openMenu = () => { $('#menu').classList.add('open'); $('#overlay').classList.add('show'); };
const closeMenu = () => { $('#menu').classList.remove('open'); $('#overlay').classList.remove('show'); };

document.addEventListener('click', async ev => {
  const t = ev.target.closest('[data-go],[data-open],[data-buy],[data-review],[data-del]'); if (!t) return;
  try {
    if (t.dataset.go) { location.hash = t.dataset.go; closeMenu(); } // closeMenu also covers tapping the screen you are already on
    else if (t.dataset.open) location.hash = '#/event/' + t.dataset.open;
    else if (t.dataset.del) { if (await confirmBox('¿Eliminar este evento?')) { await API.deleteEvent(t.dataset.del); toast('Evento eliminado'); route(true); } }
    else if (t.dataset.buy) { await API.buyTicket(t.dataset.buy); toast('¡Boleto comprado!'); route(true); }
    else if (t.dataset.review) { const r = await reviewBox(); if (r) { await API.addReview(t.dataset.review, r.text, r.stars); route(true); } }
  } catch (e) { toast(e.message); }
});
$('#btn-menu').onclick = openMenu; $('#btn-close').onclick = closeMenu; $('#overlay').onclick = closeMenu;
$('#btn-logout').onclick = () => { Session.clear(); location.hash = '#/login'; route(); };
window.addEventListener('hashchange', () => route()); // arrow fn: the event object must not be read as the `silent` flag
route();
