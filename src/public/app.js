const state = {
  token: localStorage.getItem('fitclub-token'),
  user: null,
  authMode: 'login',
  classes: [],
  members: [],
  subscriptions: []
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

async function api(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(`/api${path}`, { ...options, headers });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || 'La requête a échoué.');
  return payload;
}

function setAuthMode(mode) {
  state.authMode = mode;
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
  byId('auth-title').textContent = registering ? 'Rejoignez le club.' : 'Ravi de vous revoir.';
  byId('auth-subtitle').textContent = registering
    ? 'Créez votre espace membre pour réserver vos cours.'
    : 'Connectez-vous pour accéder à votre espace.';
  byId('auth-submit').innerHTML = registering
    ? 'Créer mon compte <span aria-hidden="true">→</span>'
    : 'Se connecter <span aria-hidden="true">→</span>';
  authForm.elements.password.autocomplete = registering ? 'new-password' : 'current-password';
  showMessage(byId('auth-message'), '');
}

function formatDate(value, options = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Intl.DateTimeFormat('fr-FR', options).format(new Date(value));
}

function renderClasses() {
  const list = byId('classes-list');
  byId('class-count').textContent = `${state.classes.length} séance${state.classes.length > 1 ? 's' : ''}`;
  if (!state.classes.length) {
    list.innerHTML = '<p class="empty-state">Aucun cours planifié pour le moment.</p>';
    return;
  }

  list.innerHTML = state.classes.map((groupClass) => {
    const date = new Date(groupClass.startsAt);
    const full = groupClass.registeredCount >= groupClass.capacity;
    const action = state.user.role === 'admin'
      ? `<button class="button button-dark" data-action="delete-class" data-id="${escapeHtml(groupClass.id)}">Supprimer</button>`
      : groupClass.isBooked
        ? `<button class="button button-booked" data-action="cancel-booking" data-id="${escapeHtml(groupClass.id)}">Inscrit · annuler</button>`
        : full
          ? '<button class="button button-disabled" disabled>Complet</button>'
          : `<button class="button button-primary" data-action="book" data-id="${escapeHtml(groupClass.id)}">Réserver <span aria-hidden="true">→</span></button>`;
    return `<article class="class-row">
      <div class="class-date"><strong>${escapeHtml(new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(date))}</strong><span>${escapeHtml(new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date))} · ${escapeHtml(new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date))}</span></div>
      <div class="class-details"><h3>${escapeHtml(groupClass.title)}</h3><p class="class-meta">${escapeHtml(new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date))} · ${escapeHtml(groupClass.durationMinutes)} min · Coach ${escapeHtml(groupClass.coach)}</p></div>
      <div class="class-action"><span class="spots">${escapeHtml(groupClass.registeredCount)} / ${escapeHtml(groupClass.capacity)} places</span>${action}</div>
    </article>`;
  }).join('');
}

function renderMembership() {
  const content = byId('membership-content');
  if (state.user.role === 'admin') {
    content.innerHTML = `<p class="muted">${state.members.length} adhérent${state.members.length > 1 ? 's' : ''} · ${state.subscriptions.length} abonnement${state.subscriptions.length > 1 ? 's' : ''} suivi${state.subscriptions.length > 1 ? 's' : ''}</p>`;
    return;
  }
  const current = state.subscriptions.find((item) => item.status === 'active' && new Date(item.endDate) > new Date());
  if (!current) {
    content.innerHTML = '<p class="muted">Aucun abonnement actif. Contactez l’accueil du club pour choisir votre formule.</p>';
    return;
  }
  content.innerHTML = `<p class="muted">Votre accès se termine le ${escapeHtml(formatDate(current.endDate, { day: 'numeric', month: 'long', year: 'numeric' }))}.</p><div class="subscription-status"><span>Statut</span><strong>Actif</strong></div>`;
}

function renderAdmin() {
  const panel = byId('admin-panel');
  const isAdmin = state.user.role === 'admin';
  panel.hidden = !isAdmin;
  if (!isAdmin) return;

  byId('members-list').innerHTML = state.members.length
    ? state.members.map((member) => `<div class="member-row"><span>${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)}</span><span><button class="text-button" data-action="delete-member" data-id="${escapeHtml(member._id)}" aria-label="Supprimer ${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)}">Supprimer</button></span></div>`).join('')
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
}

async function refreshDashboard() {
  const [classes, subscriptions] = await Promise.all([
    api('/classes'),
    api('/subscriptions')
  ]);
  state.classes = classes.data;
  state.subscriptions = subscriptions.data;
  if (state.user.role === 'admin') {
    const [members, expiring] = await Promise.all([
      api('/members'), api('/subscriptions/expiring?days=7')
    ]);
    state.members = members.data;
    state.expiring = expiring.data;
  }
  renderClasses();
  renderMembership();
  renderAdmin();
}

async function openDashboard(user) {
  state.user = user;
  authView.hidden = true;
  dashboard.hidden = false;
  byId('session-controls').hidden = false;
  byId('session-name').textContent = user.role === 'admin' ? `${user.name} · Admin` : user.name;
  showMessage(byId('dashboard-message'), '');
  await refreshDashboard();
}

function signOut() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('fitclub-token');
  dashboard.hidden = true;
  authView.hidden = false;
  byId('session-controls').hidden = true;
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

byId('classes-list').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
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
  if (!button || !window.confirm('Supprimer cet adhérent et ses données associées ?')) return;
  try {
    await api(`/members/${button.dataset.id}`, { method: 'DELETE' });
    await refreshDashboard();
    showMessage(byId('dashboard-message'), 'Adhérent supprimé.', true);
  } catch (error) {
    showMessage(byId('dashboard-message'), error.message);
  }
});

byId('class-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());
  payload.startsAt = new Date(payload.startsAt).toISOString();
  try {
    await api('/classes', { method: 'POST', body: JSON.stringify(payload) });
    event.currentTarget.reset();
    event.currentTarget.elements.durationMinutes.value = 45;
    event.currentTarget.elements.capacity.value = 12;
    await refreshDashboard();
    showMessage(byId('dashboard-message'), 'Cours ajouté au planning.', true);
  } catch (error) {
    showMessage(byId('dashboard-message'), error.message);
  }
});

byId('member-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
  try {
    await api('/members', { method: 'POST', body: JSON.stringify(payload) });
    event.currentTarget.reset();
    await refreshDashboard();
    showMessage(byId('dashboard-message'), 'Adhérent ajouté.', true);
  } catch (error) {
    showMessage(byId('dashboard-message'), error.message);
  }
});

byId('subscription-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
  payload.startDate = new Date(`${payload.startDate}T00:00:00`).toISOString();
  try {
    await api('/subscriptions', { method: 'POST', body: JSON.stringify(payload) });
    event.currentTarget.reset();
    event.currentTarget.elements.durationMonths.value = 3;
    await refreshDashboard();
    showMessage(byId('dashboard-message'), 'Abonnement créé.', true);
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