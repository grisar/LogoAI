// Frontend API Integration for LogoAI

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// LocalStorage keys
const STORAGE_KEYS = {
  TOKEN: 'logoai_token',
  USER: 'logoai_user',
  THEME: 'logoai_theme',
};

// ==================== AUTH ====================

/**
 * Register new user
 */
async function register(email, password, name) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }

  const data = await response.json();

  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

  return data;
}

/**
 * Login user
 */
async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data = await response.json();

  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

  // Apply theme
  if (data.user.theme) {
    applyTheme(data.user.theme);
  }

  return data;
}

/**
 * Logout user
 */
function logout() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  show('landing');
  toast('Вы вышли из аккаунта');
}

/**
 * Get stored token
 */
function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

/**
 * Get stored user
 */
function getStoredUser() {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return !!getToken();
}

// ==================== AUTHORIZED REQUESTS ====================

/**
 * Make authorized request
 */
async function authFetch(url, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Handle 401 - token expired
  if (response.status === 401) {
    logout();
    throw new Error('Session expired');
  }

  return response;
}

// ==================== USER ====================

/**
 * Get current user
 */
async function getCurrentUser() {
  const response = await authFetch(`${API_BASE_URL}/api/users/me`);

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  const data = await response.json();

  // Update localStorage
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

  return data.user;
}

/**
 * Update user profile
 */
async function updateProfile(updates) {
  const response = await authFetch(`${API_BASE_URL}/api/users/me`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  const data = await response.json();

  // Update localStorage
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

  // Apply theme if changed
  if (updates.theme) {
    applyTheme(updates.theme);
  }

  return data.user;
}

// ==================== PROJECTS ====================

/**
 * Get all projects
 */
async function getProjects(filters = {}) {
  const params = new URLSearchParams();

  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  if (filters.favorites) params.append('favorites', 'true');

  const response = await authFetch(`${API_BASE_URL}/api/projects?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to get projects');
  }

  const data = await response.json();
  return data.projects;
}

/**
 * Get project by ID
 */
async function getProject(projectId) {
  const response = await authFetch(`${API_BASE_URL}/api/projects/${projectId}`);

  if (!response.ok) {
    throw new Error('Failed to get project');
  }

  const data = await response.json();
  return data.project;
}

/**
 * Create project
 */
async function createProject(projectData) {
  const response = await authFetch(`${API_BASE_URL}/api/projects`, {
    method: 'POST',
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    throw new Error('Failed to create project');
  }

  const data = await response.json();
  return data.project;
}

/**
 * Update project
 */
async function updateProject(projectId, updates) {
  const response = await authFetch(`${API_BASE_URL}/api/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update project');
  }

  const data = await response.json();
  return data.project;
}

/**
 * Toggle project favorite
 */
async function toggleFavorite(projectId) {
  const response = await authFetch(`${API_BASE_URL}/api/projects/${projectId}/favorite`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to toggle favorite');
  }

  const data = await response.json();
  return data.isFavorite;
}

/**
 * Delete project
 */
async function deleteProject(projectId) {
  const response = await authFetch(`${API_BASE_URL}/api/projects/${projectId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete project');
  }

  return { success: true };
}

// ==================== GENERATION ====================

/**
 * Generate logos synchronously
 */
async function generateLogosSync(params) {
  const response = await authFetch(`${API_BASE_URL}/api/generate/sync`, {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Generation failed');
  }

  const data = await response.json();
  return data;
}

/**
 * Start async generation
 */
async function startGeneration(params) {
  const response = await authFetch(`${API_BASE_URL}/api/generate/async`, {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start generation');
  }

  const data = await response.json();
  return data;
}

/**
 * Poll generation status
 */
async function pollGenerationStatus(predictionId) {
  const response = await authFetch(`${API_BASE_URL}/api/generate/status/${predictionId}`);

  if (!response.ok) {
    throw new Error('Failed to get generation status');
  }

  const data = await response.json();
  return data;
}

/**
 * Cancel generation
 */
async function cancelGeneration(predictionId) {
  const response = await authFetch(`${API_BASE_URL}/api/generate/cancel/${predictionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to cancel generation');
  }

  const data = await response.json();
  return data;
}

// ==================== SUBSCRIPTION ====================

/**
 * Get current subscription
 */
async function getSubscription() {
  const response = await authFetch(`${API_BASE_URL}/api/subscriptions/me`);

  if (!response.ok) {
    throw new Error('Failed to get subscription');
  }

  const data = await response.json();
  return data.subscription;
}

/**
 * Create checkout session
 */
async function createCheckout(planType) {
  const response = await authFetch(`${API_BASE_URL}/api/subscriptions/checkout`, {
    method: 'POST',
    body: JSON.stringify({ planType }),
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout');
  }

  const data = await response.json();
  return data;
}

/**
 * Cancel subscription
 */
async function cancelSubscription() {
  const response = await authFetch(`${API_BASE_URL}/api/subscriptions/cancel`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to cancel subscription');
  }

  const data = await response.json();
  return data;
}

/**
 * Get invoices
 */
async function getInvoices() {
  const response = await authFetch(`${API_BASE_URL}/api/subscriptions/invoices`);

  if (!response.ok) {
    throw new Error('Failed to get invoices');
  }

  const data = await response.json();
  return data.invoices;
}

// ==================== THEME ====================

/**
 * Apply theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

/**
 * Toggle theme
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  applyTheme(newTheme);

  // Save to server if authenticated
  if (isAuthenticated()) {
    updateProfile({ theme: newTheme }).catch(console.error);
  }

  return newTheme;
}

// ==================== WIZARD INTEGRATION ====================

/**
 * Get wizard parameters from form
 */
function getWizardParams() {
  const brandName = document.getElementById('bname')?.value || '';

  // Get selected niche
  const nicheEl = document.querySelector('.chip.on[data-category="niche"]');
  const niche = nicheEl?.textContent?.trim();

  // Get selected style
  const styleEl = document.querySelector('.chip.on[data-category="style"]');
  const style = styleEl?.textContent?.trim();

  // Get selected colors
  const colorEls = document.querySelectorAll('.sw.on');
  const colors = Array.from(colorEls).map((el) =>
    el.style.background || rgbToHex(el.style.backgroundColor)
  );

  // Get text prompt (Pro feature)
  const textPrompt = document.querySelector('textarea[placeholder*="FLUX.1"]')?.value?.trim();

  return {
    brandName,
    niche,
    style,
    colors,
    textPrompt,
    numVariants: 4,
  };
}

/**
 * Convert RGB to Hex
 */
function rgbToHex(rgb) {
  if (rgb.startsWith('#')) return rgb;

  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return rgb;

  const hex = (x) => {
    const hexValue = parseInt(x).toString(16);
    return hexValue.length === 1 ? '0' + hexValue : hexValue;
  };

  return '#' + hex(match[1]) + hex(match[2]) + hex(match[3]);
}

/**
 * Start logo generation with progress
 */
async function startLogoGeneration() {
  const params = getWizardParams();

  if (!params.brandName) {
    toast('Введите название бренда');
    return;
  }

  try {
    // Switch to results view
    show('results');

    // Show generating state
    document.getElementById('gen-state').style.display = '';
    document.getElementById('res-state').style.display = 'none';

    // Start async generation
    const { predictionId, projectId } = await startGeneration(params);

    // Poll for status
    let status = 'processing';
    let progress = 0;

    const pollInterval = setInterval(async () => {
      try {
        const result = await pollGenerationStatus(predictionId);
        status = result.status;

        // Update progress based on status
        if (status === 'processing') {
          progress = Math.min(progress + 10, 90);
        } else if (status === 'completed') {
          progress = 100;
        } else if (status === 'failed') {
          clearInterval(pollInterval);
          toast('Ошибка генерации: ' + (result.error || 'Unknown error'));
          return;
        }

        // Update UI
        const fill = document.getElementById('prog-fill');
        const pct = document.getElementById('prog-pct');
        const msg = document.getElementById('prog-msg');

        if (fill) fill.style.width = progress + '%';
        if (pct) pct.textContent = progress + '%';

        if (status === 'completed') {
          if (msg) msg.textContent = 'Готово!';
          clearInterval(pollInterval);

          // Show results
          setTimeout(async () => {
            const project = await getProject(projectId);

            document.getElementById('gen-state').style.display = 'none';
            document.getElementById('res-state').style.display = '';

            // Render results
            renderResults(project.logos);
          }, 500);
        }
      } catch (error) {
        console.error('Poll error:', error);
        clearInterval(pollInterval);
        toast('Ошибка при получении статуса');
      }
    }, 2000); // Poll every 2 seconds

  } catch (error) {
    console.error('Generation error:', error);
    toast('Ошибка генерации: ' + error.message);
    show('gen');
  }
}

/**
 * Render generated logos
 */
function renderResults(logos) {
  const grid = document.querySelector('.results-grid');

  if (!grid) return;

  if (!logos || logos.length === 0) {
    grid.innerHTML = '<p>Нет сгенерированных логотипов</p>';
    return;
  }

  grid.innerHTML = logos
    .map(
      (logo, index) => `
    <div class="res-card ${index === 0 ? 'on' : ''}" onclick="selectLogo(this)">
      <div class="res-thumb" style="background:#F4F4F6">
        <img src="${logo.url}" alt="Вариант ${logo.variant}" style="width:100%;height:100%;object-fit:contain">
      </div>
      <div class="res-foot">
        <span class="res-foot-lbl">Вариант ${logo.variant}</span>
        ${index === 0 ? '<span class="badge badge-violet">Выбран</span>' : ''}
      </div>
    </div>
  `
    )
    .join('');
}

/**
 * Select logo
 */
function selectLogo(element) {
  document.querySelectorAll('.res-card').forEach((card) => {
    card.classList.remove('on');
    const badge = card.querySelector('.badge');
    if (badge) badge.remove();
  });

  element.classList.add('on');

  const footer = element.querySelector('.res-foot');
  if (footer && !footer.querySelector('.badge')) {
    const badge = document.createElement('span');
    badge.className = 'badge badge-violet';
    badge.textContent = 'Выбран';
    footer.appendChild(badge);
  }
}

// ==================== DASHBOARD INTEGRATION ====================

/**
 * Load projects for dashboard
 */
async function loadDashboardProjects() {
  try {
    const projects = await getProjects();
    renderProjectsGrid(projects);
  } catch (error) {
    console.error('Load projects error:', error);
    toast('Ошибка при загрузке проектов');
  }
}

/**
 * Render projects grid
 */
function renderProjectsGrid(projects) {
  const grid = document.getElementById('proj-grid');

  if (!grid) return;

  if (!projects || projects.length === 0) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h3>Нет проектов</h3>
        <p>Создайте свой первый логотип</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = projects
    .map((project) => `
    <div class="proj-card" onclick="openProject('${project.id}')" style="animation-delay:${Math.random() * 200}ms">
      <div class="proj-thumb" style="background:#F4F4F6">
        <button class="proj-fav ${project.isFavorite ? 'on' : ''}" onclick="event.stopPropagation();handleFavorite('${project.id}', ${project.isFavorite})">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        ${project.logos && project.logos.length > 0 ? `
          <img src="${project.logos[0].url}" alt="${project.name}" style="width:70%;height:70%;object-fit:contain">
        ` : `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:70%;height:70%;opacity:0.3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        `}
      </div>
      <div class="proj-meta">
        <div class="proj-name">${project.name}</div>
        <div class="proj-date">${formatDate(project.updatedAt)}</div>
        <div class="proj-acts">
          <span class="badge ${project.status === 'done' ? 'badge-ok' : 'badge-draft'}">${project.status === 'done' ? 'Готов' : 'Черновик'}</span>
          <button class="btn btn-sm btn-ghost">${project.status === 'done' ? 'Скачать' : 'Открыть'}</button>
        </div>
      </div>
    </div>
  `).join('') + `
    <button class="proj-new" onclick="show('gen')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
      <span>Создать новый</span>
    </button>
  `;
}

/**
 * Handle favorite toggle
 */
async function handleFavorite(projectId, currentState) {
  try {
    const newState = await toggleFavorite(projectId);
    loadDashboardProjects();
    toast(newState ? 'Добавлено в избранное' : 'Убрано из избранного');
  } catch (error) {
    console.error('Favorite toggle error:', error);
    toast('Ошибка при обновлении избранного');
  }
}

/**
 * Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} минут назад`;
  if (hours < 24) return `${hours} час${hours > 1 ? (hours < 5 ? 'а' : 'ов') : ''} назад`;
  if (days < 7) return `${days} дн${days > 1 ? 'я' : 'ь'} назад`;
  return date.toLocaleDateString('ru-RU');
}

/**
 * Open project
 */
async function openProject(projectId) {
  try {
    const project = await getProject(projectId);

    if (project.status === 'done') {
      // Render results
      renderResults(project.logos);
      show('results');
    } else {
      // Open in editor
      show('editor');
    }
  } catch (error) {
    console.error('Open project error:', error);
    toast('Ошибка при открытии проекта');
  }
}

// ==================== INITIALIZATION ====================

/**
 * Initialize app
 */
async function initApp() {
  // Apply saved theme
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  applyTheme(savedTheme);

  // Check authentication
  if (isAuthenticated()) {
    try {
      // Update user info
      await getCurrentUser();

      // Update auth button
      const authButtons = document.querySelectorAll('.btn-ghost[onclick*="auth"], .btn-violet[onclick*="auth"]');
      authButtons.forEach((btn) => {
        const user = getStoredUser();
        if (user) {
          btn.textContent = user.name || 'Профиль';
          btn.onclick = () => show('dashboard');
        }
      });
    } catch (error) {
      console.error('Init error:', error);
      logout();
    }
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initApp);

// Export functions for global use
window.api = {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  getProjects,
  getProject,
  createProject,
  updateProject,
  toggleFavorite,
  deleteProject,
  generateLogosSync,
  startGeneration,
  pollGenerationStatus,
  cancelGeneration,
  getSubscription,
  createCheckout,
  cancelSubscription,
  getInvoices,
  toggleTheme,
  startLogoGeneration,
  selectLogo,
  loadDashboardProjects,
  renderProjectsGrid,
  handleFavorite,
  openProject,
};