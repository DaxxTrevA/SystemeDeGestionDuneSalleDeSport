const state = {
  token: localStorage.getItem('fitclub-token'),
  user: null,
  authMode: 'login',
  classes: [],
  members: [],
  subscriptions: [],
  admins: [],
  adminNotifications: [],
  subscriptionOffer: { monthlyPriceAr: 22000 },
  clubSettings: { courseTypes: [], coaches: [], monthlyPriceAr: 22000 },
  notificationInterval: null,
  pendingDeleteMemberId: null,
  editingClassId: null
};

const byId = (id) => document.getElementById(id);
const authView = byId('auth-view');
const dashboard = byId('dashboard');
const authForm = byId('auth-form');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function showMessage(element, message, success = false) {
  element.textContent = message;
  element.hidden = !message;
  element.classList.toggle('is-success', success);
}

function updateWithTransition(update) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !document.startViewTransition) {
    update();
    return;
  }
  document.startViewTransition(update);
}

async function api(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(`/api${path}`, { ...options, headers });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || 'La requête a échoué.');
  return payload;
}

function setAuthMode(mode, clearMessage = true) {
  state.authMode = mode;
  updateWithTransition(() => {
    const registering = mode === 'register';
    document.querySelectorAll('[data-auth-mode]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.authMode === mode);
    });
    const registerFields = byId('register-fields');
    registerFields.hidden = !registering;
    registerFields.querySelectorAll('input').forEach((input) => {
      input.disabled = !registering;
      input.required = registering && input.name !== 'phone';
    });
    byId('auth-title').textContent = registering ? 'Bienvenue au club.' : 'Ravi de te revoir.';
    byId('auth-subtitle').textContent = registering
      ? 'Crée ton espace et prépare ta prochaine séance.'
      : 'Connecte-toi pour retrouver ton espace.';
    byId('auth-submit').innerHTML = registering
      ? 'Créer mon compte <span aria-hidden="true">→</span>'
      : 'Me connecter <span aria-hidden="true">→</span>';
    authForm.elements.password.autocomplete = registering ? 'new-password' : 'current-password';
    if (clearMessage) showMessage(byId('auth-message'), '');
  });
}

function formatDate(value, options = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Intl.DateTimeFormat('fr-FR', options).format(new Date(value));
}

function formatAriary(value) {
  return `${Number(value).toLocaleString('fr-FR')} Ar`;
}

function renderOverview() {
  const upcoming = state.classes.filter((item) => new Date(item.startsAt) > new Date());
  const nextClass = upcoming.reduce((closest, item) =>
    !closest || new Date(item.startsAt) < new Date(closest.startsAt) ? item : closest, null);
  const availableSpots = upcoming.reduce((total, item) =>
    total + Math.max(0, Number(item.capacity) - Number(item.registeredCount)), 0);
  const firstName = state.user.name.trim().split(/\s+/)[0];

  byId('welcome-title').textContent = `Bonjour, ${firstName}.`;
  byId('overview-stats').innerHTML = `
    <div class="overview-stat"><span class="stat-label">À venir</span><strong>${upcoming.length}</strong><span class="stat-note">séance${upcoming.length > 1 ? 's' : ''} au planning</span></div>
    <div class="overview-stat stat-highlight"><span class="stat-label">Places disponibles</span><strong>${availableSpots}</strong><span class="stat-note">sur les cours à venir</span></div>
    <div class="overview-stat"><span class="stat-label">Prochain rendez-vous</span><strong class="next-class-name">${nextClass ? escapeHtml(nextClass.title) : 'À définir'}</strong><span class="stat-note">${nextClass ? escapeHtml(formatDate(nextClass.startsAt, { weekday: 'long', day: 'numeric', month: 'long' })) : 'De nouvelles séances arrivent bientôt'}</span></div>`;
}

function renderClasses() {
  const list = byId('classes-list');
  byId('class-count').textContent = `${state.classes.length} séance${state.classes.length > 1 ? 's' : ''}`;
  if (!state.classes.length) {
    list.innerHTML = state.user.role === 'member'
      ? `<section class="member-empty-state" aria-labelledby="empty-schedule-title">
          <div class="empty-state-heading"><p class="eyebrow">LE PROCHAIN RENDEZ-VOUS SE PRÉPARE</p><span class="schedule-status"><span></span>Pas encore de cours publié</span></div>
          <h3 id="empty-schedule-title">Le programme arrive bientôt.</h3>
          <p class="empty-state-intro">Ton espace est prêt. Dès que le club publie ses prochaines séances, tu pourras les retrouver ici et réserver ta place.</p>
          <div class="activity-ideas" aria-label="Idées d’activités à découvrir">
            <article class="activity-idea"><span>01 · CARDIO</span><h4>HIIT</h4><p>Des intervalles dynamiques pour faire monter le rythme.</p></article>
            <article class="activity-idea"><span>02 · MOBILITÉ</span><h4>Pilates</h4><p>Renforce le centre du corps et travaille le contrôle.</p></article>
            <article class="activity-idea"><span>03 · ÉNERGIE</span><h4>Boxe cardio</h4><p>Coordination, jeu de jambes et cardio en musique.</p></article>
          </div>
          <div class="empty-state-footer"><p><strong>Petit conseil</strong><br>Choisis une activité qui te plaît. La régularité vient plus facilement quand le mouvement est un plaisir.</p><button class="button button-secondary" type="button" data-action="refresh-schedule">Actualiser le planning</button></div>
          <p class="ideas-disclaimer">Ces activités sont des idées, pas des séances actuellement réservables.</p>
          <section class="club-promotion" aria-label="Offre du club">
            <div><p class="eyebrow">À LA UNE · ITAOSYCLUB</p><h4>Ta prochaine bonne habitude commence ici.</h4><p>Choisis une formule selon ton rythme et prépare ta reprise avec le club.</p></div>
            <div class="club-promotion-offer"><strong>${escapeHtml(formatAriary(state.subscriptionOffer.monthlyPriceAr))}</strong><span>pour 1 mois</span><button class="text-button" type="button" data-action="show-membership-offer">Voir l’offre</button></div>
          </section>
        </section>`
      : '<div class="empty-state admin-empty-state"><strong>Le planning est encore vide.</strong><span>Crée une séance dans le panneau Administration pour la rendre visible aux adhérents.</span></div>';
    return;
  }

  list.innerHTML = state.classes.map((groupClass) => {
    const date = new Date(groupClass.startsAt);
    const full = groupClass.registeredCount >= groupClass.capacity;
    const occupancy = Math.min(100, Math.round((groupClass.registeredCount / groupClass.capacity) * 100));
    const action = state.user.role === 'admin'
      ? `<div class="class-admin-actions"><button class="button button-secondary" data-action="edit-class" data-id="${escapeHtml(groupClass.id)}">Modifier</button><button class="text-button" data-action="delete-class" data-id="${escapeHtml(groupClass.id)}">Annuler</button></div>`
      : groupClass.isBooked
        ? `<button class="button button-booked" data-action="cancel-booking" data-id="${escapeHtml(groupClass.id)}">Inscrit · annuler</button>`
        : full
          ? '<button class="button button-disabled" disabled>Complet</button>'
          : `<button class="button button-primary" data-action="book" data-id="${escapeHtml(groupClass.id)}">Réserver <span aria-hidden="true">→</span></button>`;
    return `<article class="class-row">
      <div class="class-date"><strong>${escapeHtml(new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(date))}</strong><span>${escapeHtml(new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date))} · ${escapeHtml(new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date))}</span></div>
      <div class="class-details"><h3>${escapeHtml(groupClass.title)}</h3><p class="class-meta">${escapeHtml(new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date))} · ${escapeHtml(groupClass.durationMinutes)} min · Coach ${escapeHtml(groupClass.coach)}</p></div>
      <div class="class-action"><span class="spots">${escapeHtml(groupClass.registeredCount)} / ${escapeHtml(groupClass.capacity)} places</span><span class="capacity-track" aria-label="${occupancy}% des places réservées"><span style="width: ${occupancy}%"></span></span>${action}</div>
    </article>`;
  }).join('');
}

function renderMembership() {
  const content = byId('membership-content');
  const premiumBadge = byId('premium-badge');
  premiumBadge.hidden = true;
  if (state.user.role === 'admin') {
    content.innerHTML = `<p class="muted">${state.members.length} adhérent${state.members.length > 1 ? 's' : ''} · ${state.subscriptions.length} abonnement${state.subscriptions.length > 1 ? 's' : ''} suivi${state.subscriptions.length > 1 ? 's' : ''}</p>`;
    return;
  }
  const current = state.subscriptions.find((item) => item.status === 'active' && new Date(item.endDate) > new Date());
  if (current) {
    premiumBadge.hidden = false;
    content.innerHTML = `<p class="muted">Ton accès se termine le ${escapeHtml(formatDate(current.endDate, { day: 'numeric', month: 'long', year: 'numeric' }))}.</p><div class="subscription-status"><span>Statut</span><strong>Actif · Premium</strong></div><p class="subscription-price-note">Formule ${escapeHtml(current.durationMonths)} mois · ${escapeHtml(formatAriary(current.totalPriceAr))}</p>`;
    return;
  }
  const pending = state.subscriptions.find((item) => item.status === 'pending');
  if (pending) {
    content.innerHTML = `<div class="request-status"><span>EN ATTENTE</span><strong>Demande envoyée aux admins</strong><p>${escapeHtml(pending.durationMonths)} mois · ${escapeHtml(formatAriary(pending.totalPriceAr))}. Le club confirmera ton abonnement.</p></div>`;
    return;
  }
  const rejected = state.subscriptions.find((item) => item.status === 'rejected');
  if (!current) {
    content.innerHTML = `${rejected ? '<p class="request-rejected">La dernière demande n’a pas été acceptée. Tu peux choisir une autre durée ou contacter le club.</p>' : '<p class="muted">Choisis ta durée. Le tarif total est calculé avant l’envoi de la demande.</p>'}<form id="member-offer-form" class="member-offer-form"><label>Durée<input name="durationMonths" type="number" min="1" max="36" step="1" value="1" required><span class="optional">mois · tarif fixe par mois</span></label><div class="offer-price-summary"><span>${escapeHtml(formatAriary(state.subscriptionOffer.monthlyPriceAr))} / mois</span><strong id="offer-total">${escapeHtml(formatAriary(state.subscriptionOffer.monthlyPriceAr))}</strong></div><button class="button button-primary button-wide" type="submit">Demander cet abonnement</button><p class="offer-payment-note">Demande à confirmer par le club. Le paiement se fait auprès de l’accueil.</p></form>`;
    return;
  }
}

function renderAdmin() {
  const panel = byId('admin-panel');
  const isAdmin = state.user.role === 'admin';
  panel.hidden = !isAdmin;
  if (!isAdmin) return;

  renderPresetSelector('titlePreset', state.clubSettings.courseTypes, 'Choisir une activité');
  renderPresetSelector('coachPreset', state.clubSettings.coaches, 'Choisir un coach');
  renderPresetLists();
  byId('offer-settings-form').elements.monthlyPriceAr.value = state.clubSettings.monthlyPriceAr || 22000;

  byId('member-count').textContent = `(${state.members.length})`;
  byId('members-list').innerHTML = state.members.length
    ? state.members.map((member) => `<div class="member-row"><span class="member-row-info"><strong>${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)}</strong><span>${escapeHtml(member.email)}</span></span><button class="text-button" data-action="delete-member" data-id="${escapeHtml(member._id)}" aria-label="Supprimer ${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)}">Supprimer</button></div>`).join('')
    : '<p class="muted">Aucun adhérent.</p>';

  const memberSelect = byId('subscription-form').elements.member;
  memberSelect.innerHTML = '<option value="">Sélectionner</option>' + state.members.map((member) =>
    `<option value="${escapeHtml(member._id)}">${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)}</option>`
  ).join('');

  const expiring = state.expiring || [];
  const alert = byId('expiry-alert');
  alert.hidden = !expiring.length;
  alert.textContent = expiring.length
    ? `${expiring.length} abonnement${expiring.length > 1 ? 's' : ''} expire${expiring.length > 1 ? 'nt' : ''} dans les 7 prochains jours.`
    : '';
  renderAdminNotifications();
}

function renderAdminNotifications() {
  const requests = state.adminNotifications;
  const count = requests.length;
  byId('notification-count').textContent = count;
  byId('drawer-notification-count').textContent = count ? `(${count})` : '';
  byId('admin-notification-button').hidden = state.user.role !== 'admin' || count === 0;
  byId('admin-notifications-empty').hidden = count > 0;
  byId('admin-notifications').innerHTML = requests.map((request) => {
    const memberName = request.member
      ? `${request.member.firstName} ${request.member.lastName}`
      : 'Adhérent';
    return `<li class="subscription-request-row"><div><strong>${escapeHtml(memberName)}</strong><span>${escapeHtml(request.member?.email || '')}</span><span>${escapeHtml(request.durationMonths)} mois · ${escapeHtml(formatAriary(request.totalPriceAr))}</span></div><div class="request-actions"><button class="admin-access-button" type="button" data-request-action="approve" data-request-id="${escapeHtml(request._id)}">Activer</button><button class="request-reject-button" type="button" data-request-action="reject" data-request-id="${escapeHtml(request._id)}">Refuser</button></div></li>`;
  }).join('');
}

function renderPresetSelector(name, values, placeholder) {
  const select = byId('class-form').elements[name];
  const previousValue = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>${values.map((value) =>
    `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
  ).join('')}<option value="__custom">Autre…</option>`;
  if (previousValue === '__custom' || values.includes(previousValue)) select.value = previousValue;
}

function renderPresetLists() {
  byId('course-type-presets').innerHTML = state.clubSettings.courseTypes.map((value) =>
    `<li>${escapeHtml(value)}<button type="button" data-remove-preset="courseTypes" data-value="${escapeHtml(value)}" aria-label="Retirer ${escapeHtml(value)}">Retirer</button></li>`
  ).join('');
  byId('coach-presets').innerHTML = state.clubSettings.coaches.map((value) =>
    `<li>${escapeHtml(value)}<button type="button" data-remove-preset="coaches" data-value="${escapeHtml(value)}" aria-label="Retirer ${escapeHtml(value)}">Retirer</button></li>`
  ).join('');
}

function syncCustomPreset(select, input) {
  const isCustom = select.value === '__custom';
  input.hidden = !isCustom;
  input.disabled = !isCustom;
  input.required = isCustom;
  if (!isCustom) input.value = '';
}

function choosePreset(select, input, value) {
  if ([...select.options].some((option) => option.value === value)) {
    select.value = value;
    input.value = '';
  } else {
    select.value = '__custom';
    input.value = value;
  }
  syncCustomPreset(select, input);
}

function resetClassForm() {
  const form = byId('class-form');
  state.editingClassId = null;
  form.reset();
  syncCustomPreset(form.elements.titlePreset, form.elements.customTitle);
  syncCustomPreset(form.elements.coachPreset, form.elements.customCoach);
  form.elements.durationMinutes.value = 45;
  form.elements.capacity.value = 12;
  byId('class-form-title').textContent = 'Planifier une séance';
  byId('class-submit').innerHTML = 'Ajouter au planning <span aria-hidden="true">+</span>';
  byId('cancel-class-edit').hidden = true;
}

function beginClassEdit(groupClass) {
  const form = byId('class-form');
  state.editingClassId = groupClass.id;
  choosePreset(form.elements.titlePreset, form.elements.customTitle, groupClass.title);
  choosePreset(form.elements.coachPreset, form.elements.customCoach, groupClass.coach);
  const localStart = new Date(new Date(groupClass.startsAt).getTime() - new Date(groupClass.startsAt).getTimezoneOffset() * 60000);
  form.elements.startsAt.value = localStart.toISOString().slice(0, 16);
  form.elements.durationMinutes.value = groupClass.durationMinutes;
  form.elements.capacity.value = groupClass.capacity;
  byId('class-form-title').textContent = 'Modifier la séance';
  byId('class-submit').textContent = 'Enregistrer les changements';
  byId('cancel-class-edit').hidden = false;
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function saveClubSettings(settings) {
  const result = await api('/club-settings', { method: 'PUT', body: JSON.stringify(settings) });
  state.clubSettings = result.data;
  state.subscriptionOffer = { monthlyPriceAr: result.data.monthlyPriceAr };
  renderAdmin();
}

async function refreshDashboard() {
  const [classes, subscriptions, offer] = await Promise.all([
    api('/classes'),
    api('/subscriptions'),
    api('/club-settings/offer')
  ]);
  state.classes = classes.data;
  state.subscriptions = subscriptions.data;
  state.subscriptionOffer = offer.data;
  if (state.user.role === 'admin') {
    const [members, expiring, settings] = await Promise.all([
      api('/members'), api('/subscriptions/expiring?days=7'), api('/club-settings')
    ]);
    state.members = members.data;
    state.expiring = expiring.data;
    state.clubSettings = settings.data;
    state.subscriptionOffer = { monthlyPriceAr: settings.data.monthlyPriceAr };
  }
  updateWithTransition(() => {
    renderClasses();
    renderOverview();
    renderMembership();
    renderAdmin();
  });
}

async function openDashboard(user) {
  state.user = user;
  updateWithTransition(() => {
    authView.hidden = true;
    dashboard.hidden = false;
    byId('session-controls').hidden = false;
    byId('admin-menu-button').hidden = user.role !== 'admin';
    byId('admin-notification-button').hidden = user.role !== 'admin';
    byId('session-name').textContent = user.role === 'admin' ? `${user.name} · Admin` : user.name;
    showMessage(byId('dashboard-message'), '');
  });
  byId('admin-settings-form').elements.email.value = user.email;
  await refreshDashboard();
  if (user.role === 'admin') {
    if (state.notificationInterval) clearInterval(state.notificationInterval);
    await refreshAdminNotifications();
    state.notificationInterval = setInterval(() => refreshAdminNotifications().catch(() => {}), 15000);
  }
}

async function refreshAdminNotifications() {
  if (!state.user || state.user.role !== 'admin') return;
  const result = await api('/admins/notifications');
  state.adminNotifications = result.data;
  renderAdminNotifications();
}

async function refreshAdmins() {
  const result = await api('/admins');
  state.admins = result.data;
  byId('admins-list').innerHTML = state.admins.map((admin) =>
    `<li><div><strong>${escapeHtml(admin.name)}</strong><span>${escapeHtml(admin.email)}</span></div><button class="admin-access-button" type="button" data-admin-email="${escapeHtml(admin.email)}">Choisir</button></li>`
  ).join('');
}

async function openAdminDrawer() {
  showMessage(byId('drawer-message'), '');
  byId('admin-settings-form').elements.email.value = state.user.email;
  try {
    await refreshAdmins();
    await refreshAdminNotifications();
    const drawer = byId('admin-drawer');
    drawer.inert = false;
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('is-open');
    byId('drawer-backdrop').classList.add('is-visible');
    byId('admin-menu-button').setAttribute('aria-expanded', 'true');
    byId('close-admin-drawer').focus();
  } catch (error) {
    showMessage(byId('drawer-message'), error.message);
  }
}

function closeAdminDrawer() {
  const drawer = byId('admin-drawer');
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.inert = true;
  byId('drawer-backdrop').classList.remove('is-visible');
  byId('admin-menu-button').setAttribute('aria-expanded', 'false');
}

function signOut() {
  if (state.notificationInterval) clearInterval(state.notificationInterval);
  state.notificationInterval = null;
  closeAdminDrawer();
  state.token = null;
  state.user = null;
  localStorage.removeItem('fitclub-token');
  updateWithTransition(() => {
    dashboard.hidden = true;
    authView.hidden = false;
    byId('session-controls').hidden = true;
  });
}

function chooseAdminAccount(email) {
  signOut();
  setAuthMode('login', false);
  authForm.elements.email.value = email;
  authForm.elements.password.value = '';
  showMessage(byId('auth-message'), 'Saisis le mot de passe de cet administrateur.');
  authForm.elements.password.focus();
}

document.querySelectorAll('[data-auth-mode]').forEach((button) => {
  button.addEventListener('click', () => setAuthMode(button.dataset.authMode));
});

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(authForm);
  const payload = Object.fromEntries(form.entries());
  const registering = state.authMode === 'register';
  if (registering) payload.name = `${payload.firstName} ${payload.lastName}`.trim();
  try {
    const result = await api(registering ? '/auth/register' : '/auth/login', {
      method: 'POST', body: JSON.stringify(payload)
    });
    state.token = result.token;
    localStorage.setItem('fitclub-token', result.token);
    await openDashboard(result.user);
  } catch (error) {
    showMessage(byId('auth-message'), error.message);
  }
});

byId('logout-button').addEventListener('click', signOut);
byId('admin-menu-button').addEventListener('click', openAdminDrawer);
byId('admin-notification-button').addEventListener('click', async () => {
  await openAdminDrawer();
  byId('admin-notifications-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
byId('close-admin-drawer').addEventListener('click', () => {
  closeAdminDrawer();
  byId('admin-menu-button').focus();
});
byId('drawer-backdrop').addEventListener('click', closeAdminDrawer);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && byId('admin-drawer').classList.contains('is-open')) {
    closeAdminDrawer();
    byId('admin-menu-button').focus();
  }
});

byId('admin-settings-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  if (!payload.newPassword) delete payload.newPassword;
  try {
    const result = await api('/admins/me', { method: 'PATCH', body: JSON.stringify(payload) });
    state.user = result.data;
    form.elements.email.value = result.data.email;
    form.elements.currentPassword.value = '';
    form.elements.newPassword.value = '';
    byId('session-name').textContent = `${result.data.name} · Admin`;
    await refreshAdmins();
    showMessage(byId('drawer-message'), 'Identifiants mis à jour.', true);
  } catch (error) {
    showMessage(byId('drawer-message'), error.message);
  }
});

byId('create-admin-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  try {
    await api('/admins', { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    await refreshAdmins();
    showMessage(byId('drawer-message'), 'Administrateur créé. Son mot de passe ne sera pas affiché.', true);
  } catch (error) {
    showMessage(byId('drawer-message'), error.message);
  }
});

byId('offer-settings-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await saveClubSettings({
      ...state.clubSettings,
      monthlyPriceAr: Number(event.currentTarget.elements.monthlyPriceAr.value)
    });
    await refreshDashboard();
    showMessage(byId('drawer-message'), 'Tarif mensuel mis à jour pour les nouvelles demandes.', true);
  } catch (error) {
    showMessage(byId('drawer-message'), error.message);
  }
});

byId('admin-notifications').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-request-action]');
  if (!button) return;
  const action = button.dataset.requestAction;
  try {
    await api(`/subscriptions/${button.dataset.requestId}/${action}`, { method: 'POST' });
    await Promise.all([refreshDashboard(), refreshAdminNotifications()]);
    showMessage(byId('drawer-message'), action === 'approve' ? 'Abonnement activé. Le badge Premium est maintenant visible.' : 'Demande refusée.', true);
  } catch (error) {
    showMessage(byId('drawer-message'), error.message);
  }
});

byId('admins-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-admin-email]');
  if (button) chooseAdminAccount(button.dataset.adminEmail);
});

byId('classes-list').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === 'refresh-schedule') {
    try {
      await refreshDashboard();
      showMessage(byId('dashboard-message'), 'Planning actualisé. À bientôt pour les prochaines séances !', true);
    } catch (error) {
      showMessage(byId('dashboard-message'), error.message);
    }
    return;
  }
  if (action === 'show-membership-offer') {
    byId('membership-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (action === 'edit-class') {
    const groupClass = state.classes.find((item) => item.id === id);
    if (groupClass) beginClassEdit(groupClass);
    return;
  }
  if (action === 'delete-class' && !window.confirm('Annuler cette séance et retirer les inscriptions associées ?')) return;
  try {
    if (action === 'book') await api(`/classes/${id}/book`, { method: 'POST' });
    if (action === 'cancel-booking') await api(`/classes/${id}/book`, { method: 'DELETE' });
    if (action === 'delete-class') await api(`/classes/${id}`, { method: 'DELETE' });
    await refreshDashboard();
    showMessage(byId('dashboard-message'), 'Planning mis à jour.', true);
  } catch (error) {
    showMessage(byId('dashboard-message'), error.message);
  }
});

byId('members-list').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action="delete-member"]');
  if (!button) return;
  const member = state.members.find((item) => item._id === button.dataset.id);
  if (!member) return;
  state.pendingDeleteMemberId = member._id;
  byId('delete-member-description').textContent = `${member.firstName} ${member.lastName} (${member.email}) et ses réservations seront supprimés.`;
  byId('delete-member-form').reset();
  showMessage(byId('delete-member-message'), '');
  byId('delete-member-dialog').showModal();
  byId('delete-member-form').elements.adminPassword.focus();
});

byId('cancel-member-delete').addEventListener('click', () => byId('delete-member-dialog').close());
byId('delete-member-dialog').addEventListener('close', () => {
  state.pendingDeleteMemberId = null;
  byId('delete-member-form').reset();
  showMessage(byId('delete-member-message'), '');
});

byId('delete-member-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.pendingDeleteMemberId) return;
  const form = event.currentTarget;
  try {
    await api(`/members/${state.pendingDeleteMemberId}`, {
      method: 'DELETE',
      body: JSON.stringify({ adminPassword: form.elements.adminPassword.value })
    });
    byId('delete-member-dialog').close();
    await refreshDashboard();
    showMessage(byId('dashboard-message'), 'Adhérent supprimé.', true);
  } catch (error) {
    form.elements.adminPassword.value = '';
    showMessage(byId('delete-member-message'), error.message);
    form.elements.adminPassword.focus();
  }
});

byId('class-form').querySelectorAll('[name="titlePreset"], [name="coachPreset"]').forEach((select) => {
  select.addEventListener('change', () => {
    const customInput = eventInputFor(select);
    syncCustomPreset(select, customInput);
  });
});

function eventInputFor(select) {
  return select.name === 'titlePreset'
    ? byId('class-form').elements.customTitle
    : byId('class-form').elements.customCoach;
}

byId('class-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.title = payload.titlePreset === '__custom' ? payload.customTitle.trim() : payload.titlePreset;
  payload.coach = payload.coachPreset === '__custom' ? payload.customCoach.trim() : payload.coachPreset;
  delete payload.titlePreset;
  delete payload.customTitle;
  delete payload.coachPreset;
  delete payload.customCoach;
  payload.startsAt = new Date(payload.startsAt).toISOString();
  try {
    const isEditing = Boolean(state.editingClassId);
    const endpoint = isEditing ? `/classes/${state.editingClassId}` : '/classes';
    await api(endpoint, { method: isEditing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    resetClassForm();
    await refreshDashboard();
    showMessage(byId('dashboard-message'), isEditing ? 'Séance modifiée.' : 'Séance ajoutée au planning.', true);
  } catch (error) {
    showMessage(byId('dashboard-message'), error.message);
  }
});

byId('cancel-class-edit').addEventListener('click', resetClassForm);

byId('course-type-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const value = new FormData(form).get('presetName').trim();
  if (state.clubSettings.courseTypes.some((item) => item.toLowerCase() === value.toLowerCase())) {
    showMessage(byId('dashboard-message'), 'Cette activité existe déjà.');
    return;
  }
  try {
    await saveClubSettings({ ...state.clubSettings, courseTypes: [...state.clubSettings.courseTypes, value] });
    form.reset();
    showMessage(byId('dashboard-message'), 'Activité ajoutée aux choix.', true);
  } catch (error) {
    showMessage(byId('dashboard-message'), error.message);
  }
});

byId('coach-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const value = new FormData(form).get('presetName').trim();
  if (state.clubSettings.coaches.some((item) => item.toLowerCase() === value.toLowerCase())) {
    showMessage(byId('dashboard-message'), 'Ce coach existe déjà.');
    return;
  }
  try {
    await saveClubSettings({ ...state.clubSettings, coaches: [...state.clubSettings.coaches, value] });
    form.reset();
    showMessage(byId('dashboard-message'), 'Coach ajouté aux choix.', true);
  } catch (error) {
    showMessage(byId('dashboard-message'), error.message);
  }
});

byId('preset-lists').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-remove-preset]');
  if (!button) return;
  const field = button.dataset.removePreset;
  const nextValues = state.clubSettings[field].filter((value) => value !== button.dataset.value);
  if (!nextValues.length) {
    showMessage(byId('dashboard-message'), 'Garde au moins un choix dans la liste.');
    return;
  }
  try {
    await saveClubSettings({ ...state.clubSettings, [field]: nextValues });
    showMessage(byId('dashboard-message'), 'Choix retiré.', true);
  } catch (error) {
    showMessage(byId('dashboard-message'), error.message);
  }
});

byId('member-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  try {
    await api('/members', { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    await refreshDashboard();
    showMessage(byId('dashboard-message'), 'Adhérent ajouté.', true);
  } catch (error) {
    showMessage(byId('dashboard-message'), error.message);
  }
});

byId('subscription-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.startDate = new Date(`${payload.startDate}T00:00:00`).toISOString();
  try {
    await api('/subscriptions', { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    form.elements.durationMonths.value = 3;
    await refreshDashboard();
    showMessage(byId('dashboard-message'), 'Abonnement créé.', true);
  } catch (error) {
    showMessage(byId('dashboard-message'), error.message);
  }
});

byId('membership-content').addEventListener('input', (event) => {
  if (event.target.name !== 'durationMonths') return;
  const months = Math.min(36, Math.max(1, Number(event.target.value) || 1));
  byId('offer-total').textContent = formatAriary(state.subscriptionOffer.monthlyPriceAr * months);
});

byId('membership-content').addEventListener('submit', async (event) => {
  if (event.target.id !== 'member-offer-form') return;
  event.preventDefault();
  const form = event.target;
  const durationMonths = Number(form.elements.durationMonths.value);
  try {
    await api('/subscriptions/request', {
      method: 'POST',
      body: JSON.stringify({ durationMonths })
    });
    await refreshDashboard();
    showMessage(byId('dashboard-message'), 'Demande envoyée au club. Tu verras ici quand elle sera validée.', true);
  } catch (error) {
    showMessage(byId('dashboard-message'), error.message);
  }
});

if (state.token) {
  api('/auth/me')
    .then(({ user }) => openDashboard(user))
    .catch(signOut);
}

setAuthMode(state.authMode);