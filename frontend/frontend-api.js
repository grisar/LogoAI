// Frontend API Integration for LogoAI

const API_BASE_URL = window.API_BASE_URL || 'http://172.24.254.145:3000';

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
  
  console.log('authFetch:', {
    url,
    method: options.method,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
  });

  if (!token) {
    throw new Error('Not authenticated - no token found');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  console.log('authFetch response:', {
    status: response.status,
    ok: response.ok,
    statusText: response.statusText
  });

  // Handle 401 - token expired
  if (response.status === 401) {
    console.error('authFetch: 401 Unauthorized - token expired');
    logout();
    throw new Error('Session expired');
  }

  // Handle 403 - forbidden
  if (response.status === 403) {
    console.error('authFetch: 403 Forbidden');
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Access forbidden');
    } catch (e) {
      throw new Error('Access forbidden');
    }
  }

  // Handle 404 - not found
  if (response.status === 404) {
    console.error('authFetch: 404 Not found');
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Resource not found');
    } catch (e) {
      throw new Error('Resource not found');
    }
  }

  // Handle 500 - server error
  if (response.status >= 500) {
    console.error('authFetch: Server error', response.status);
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error');
    } catch (e) {
      throw new Error('Server error');
    }
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
  console.log('API: deleteProject called with projectId:', projectId);
  console.log('API: Full URL:', `${API_BASE_URL}/api/projects/${projectId}`);
  
  const response = await authFetch(`${API_BASE_URL}/api/projects/${projectId}`, {
    method: 'DELETE',
  });

  console.log('API: Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    let errorDetails = `HTTP ${response.status}`;
    try {
      const errorJson = await response.json();
      console.error('API: Error response:', errorJson);
      errorDetails += ` - ${errorJson.error || 'Unknown error'}`;
    } catch (e) {
      console.error('API: Could not parse error response');
    }
    throw new Error(`Failed to delete project: ${errorDetails}`);
  }

  console.log('API: Delete successful');
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
/**
 * Start async generation
 * @param {Object} params - Generation parameters
 * @param {string} params.brandName - Brand name (required)
 * @param {string} params.niche - Niche/category (default: 'design')
 * @param {string} params.customNiche - Custom niche input (optional)
 * @param {string} params.style - Logo style (default: 'minimalist')
 * @param {string[]} params.colors - Color array (default: ['#C68DFF'])
 * @param {string} params.textPrompt - Custom FLUX.1 prompt (optional, Pro feature)
 * @param {string} params.projectId - Existing project ID (optional)
 * @param {number} params.numVariants - Number of variants (1-4, default: 4)
 */
async function startGeneration(params) {
  // Валидация обязательных параметров
  if (!params.brandName || params.brandName.trim() === '') {
    throw new Error('Название бренда обязательно');
  }

  // Определяем итоговую нишу: используем customNiche если есть, иначе niche
  const finalNiche = params.customNiche?.trim() || params.niche?.trim() || 'design';

  console.log('Final niche selected:', finalNiche, '(custom:', !!params.customNiche, ')');

  // Значения по умолчанию
  const validatedParams = {
    brandName: params.brandName.trim(),
    niche: finalNiche,         // Используем финальную нишу
    style: params.style?.trim() || 'minimalist',
    colors: Array.isArray(params.colors) && params.colors.length > 0 ? params.colors : ['#C68DFF'],
    numVariants: Math.min(Math.max(params.numVariants || 4, 1), 4),
  };

  // Добавляем опциональные параметры
  if (params.textPrompt && params.textPrompt.trim()) {
    validatedParams.textPrompt = params.textPrompt.trim();
  }

  if (params.projectId) {
    validatedParams.projectId = params.projectId;
  }

  console.log('Starting generation with params:', validatedParams);

  const response = await authFetch(`${API_BASE_URL}/api/generate/async`, {
    method: 'POST',
    body: JSON.stringify(validatedParams),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start generation');
  }

  const data = await response.json();
  console.log('Generation started:', data);
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
    const result = await startGeneration(params);
    const { predictionId, projectId, status: genStatus, logos } = result;

    // If results are ready (synchronous generation), show them immediately
    if (genStatus === 'completed' && logos && logos.length > 0) {
      console.log('Synchronous generation complete, logos:', logos);
      
      // Update progress to 100%
      const fill = document.getElementById('prog-fill');
      const pct = document.getElementById('prog-pct');
      const msg = document.getElementById('prog-msg');
      
      if (fill) fill.style.width = '100%';
      if (pct) pct.textContent = '100%';
      if (msg) msg.textContent = 'Готово!';
      
      // Show results
      setTimeout(() => {
        document.getElementById('gen-state').style.display = 'none';
        document.getElementById('res-state').style.display = '';
        renderResults(logos);
      }, 500);
      return;
    }

    // If mock generation (no predictionId), fetch from project
    if (!predictionId) {
      console.log('Mock generation complete, fetching project:', projectId);
      const project = await getProject(projectId);
      console.log('Project data:', project);
      console.log('Rendering logos:', project.logos);
      
      document.getElementById('gen-state').style.display = 'none';
      document.getElementById('res-state').style.display = '';
      renderResults(project.logos);
      return;
    }

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

            console.log('Rendering logos:', project.logos);

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
 * Update counters across all UI elements
 */
function updateCounters() {
   try {
     const totalProjects = window.projectsData ? window.projectsData.length : 0;
     const draftProjects = window.projectsData ? window.projectsData.filter(p => p.status === 'draft').length : 0;
     const doneProjects = window.projectsData ? window.projectsData.filter(p => p.status === 'done').length : 0;
     const favoriteProjects = window.projectsData ? window.projectsData.filter(p => p.isFavorite).length : 0;

     document.querySelectorAll('[data-counter="total"]').forEach(el => {
       el.textContent = `· ${totalProjects}`;
     });

     document.querySelectorAll('[data-counter="drafts"]').forEach(el => {
       el.textContent = `· ${draftProjects}`;
     });

     document.querySelectorAll('[data-counter="done"]').forEach(el => {
       el.textContent = `· ${doneProjects}`;
     });

     document.querySelectorAll('#stats-projects, #dash-stats-projects, #sub-stats-projects').forEach(el => {
       el.textContent = totalProjects;
     });

     document.querySelectorAll('#stats-favorites, #dash-stats-favorites, #sub-stats-favorites').forEach(el => {
       el.textContent = favoriteProjects;
     });

     console.log('Counters updated:', { totalProjects, draftProjects, doneProjects, favoriteProjects });
   } catch (error) {
     console.error('Update counters error:', error);
   }
 }

/**
 * Load projects for dashboard
 */
async function loadDashboardProjects() {
  try {
    const projects = await getProjects();
    window.projectsData = projects;
    renderProjectsGrid(projects);
    updateCounters();
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

  if (!grid) {
    console.log('renderProjectsGrid: grid element not found');
    return;
  }

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
    <div class="proj-card" data-project-id="${project.id}" onclick="openProject('${project.id}')" style="animation-delay:${Math.random() * 200}ms">
      <div class="proj-thumb" style="background:#F4F4F6">
        <div class="proj-actions">
          <button class="proj-fav ${project.isFavorite || project.is_favorite ? 'on' : ''}" onclick="event.stopPropagation();handleFavorite('${project.id}', ${project.isFavorite || project.is_favorite})" aria-label="Избранное">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <button class="proj-delete" onclick="event.stopPropagation();showDeleteModal('${project.id}', '${project.name.replace(/'/g, "\\'")}')" aria-label="Удалить">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
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
          ${project.status === 'done' ? `
            <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();downloadProject('${project.id}')">Скачать</button>
          ` : ''}
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
async function handleFavorite(projectId, isFavorite) {
  try {
    const project = await toggleFavorite(projectId);
    
    if (window.projectsData) {
      const idx = window.projectsData.findIndex(p => p.id === projectId);
      if (idx !== -1) {
        window.projectsData[idx].is_favorite = !isFavorite;
        window.projectsData[idx].fav = !isFavorite;
      }
    }
    
    renderProjectsGrid(window.projectsData || []);
    updateCounters();
  } catch (error) {
    console.error('Toggle favorite error:', error);
    toast('Ошибка при переключении избранного');
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

/**
 * Download project logos
 */
async function downloadProject(projectId) {
  try {
    const project = await getProject(projectId);
    
    if (!project.logos || project.logos.length === 0) {
      toast('Нет логотипов для скачивания');
      return;
    }

    const logo = project.logos[0];
    const link = document.createElement('a');
    link.href = logo.url;
    link.download = `${project.name}-logo-v${logo.variant}.png`;
    link.target = '_blank';
    
    if (logo.url.startsWith('data:')) {
      const response = await fetch(logo.url);
      const blob = await response.blob();
      link.href = URL.createObjectURL(blob);
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast('Файл скачивается…');
  } catch (error) {
    console.error('Download error:', error);
    toast('Ошибка при скачивании');
  }
}

/**
 * Show delete confirmation modal
 */
function showDeleteModal(projectId, projectName) {
  console.log('showDeleteModal called from frontend-api.js with projectId:', projectId, 'projectName:', projectName);
  
  const modal = document.getElementById('modal-delete');
  const title = document.getElementById('modal-delete-title');
  const text = document.getElementById('modal-delete-text');
  const confirmBtn = document.getElementById('modal-delete-confirm');
  const cancelBtn = modal.querySelector('.btn-secondary');
  const closeBtn = modal.querySelector('.modal-close');

  console.log('Modal elements:', { modal: !!modal, title: !!title, text: !!text, confirmBtn: !!confirmBtn, cancelBtn: !!cancelBtn, closeBtn: !!closeBtn });

  title.textContent = 'Удалить логотип?';
  text.textContent = `Логотип "${projectName}" будет удалён без возможности восстановления.`;
  
  // Сохраняем ID в глобальной переменной для использования в обработчике
  if (typeof window.projectToDelete !== 'undefined') {
    window.projectToDelete = projectId;
  }
  
  // Удаляем все старые event listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  
  const newCancelBtn = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  
  const newCloseBtn = closeBtn.cloneNode(true);
  closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
  
  // Добавляем обработчик для кнопки "Удалить"
  newConfirmBtn.onclick = async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Delete confirm button clicked, deleting:', projectId);
    
    try {
      // Вызываем deleteProject из API
      await deleteProject(projectId);
      
      // Закрываем модалку
      closeModal();
      
      toast(`Логотип "${projectName}" удалён`);
    } catch (error) {
      console.error('Delete project error:', error);
      toast('Ошибка при удалении: ' + error.message);
      
      // Закрываем модалку при ошибке
      closeModal();
    }
  };
  
  // Добавляем обработчик для кнопки "Отмена"
  newCancelBtn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Cancel button clicked');
    closeModal();
  };
  
  // Добавляем обработчик для кнопки закрытия (×)
  newCloseBtn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Close button clicked');
    closeModal();
  };

  modal.style.display = 'flex';
  console.log('Modal opened');
}

function closeModal() {
  const modal = document.getElementById('modal-delete');
  if (modal) {
    modal.style.display = 'none';
    console.log('Modal closed');
  }
  
  // Сбрасываем projectToDelete
  if (typeof window.projectToDelete !== 'undefined') {
    window.projectToDelete = null;
  }
}

/**
 * Delete project
 */
async function deleteProject(projectId) {
  console.log('deleteProject called from frontend-api.js with projectId:', projectId);
  
  try {
    const user = getStoredUser();
    if (!user) {
      console.error('No user found in localStorage');
      toast('Требуется авторизация');
      throw new Error('No user found');
    }

    const token = getToken();
    if (!token) {
      console.error('No token found in localStorage');
      toast('Требуется авторизация');
      throw new Error('No token found');
    }
    
    console.log('Sending DELETE request to:', `${window.API_BASE_URL}/api/projects/${projectId}`);
    console.log('Token preview:', token.substring(0, 30) + '...');
    console.log('User ID:', user.id);
    
    const response = await fetch(`${window.API_BASE_URL}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('DELETE response status:', response.status);
    console.log('DELETE response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DELETE error response:', errorText);
      
      if (response.status === 401) {
        // Token expired - need to login again
        logout();
        toast('Сессия истекла. Войдите снова');
        throw new Error('Token expired');
      } else if (response.status === 403) {
        // Forbidden - user doesn't own the project
        console.error('403 Forbidden: User does not own this project');
        toast('Ошибка доступа: у вас нет прав на удаление этого проекта');
        throw new Error('Forbidden: User does not own this project');
      } else if (response.status === 404) {
        // Project not found
        console.error('404 Not Found: Project does not exist');
        toast('Проект не найден');
        throw new Error('Project not found');
      } else {
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }
    }

    // Удаляем из window.projectsData
    const idx = window.projectsData ? window.projectsData.findIndex(p => p.id === projectId) : -1;
    if (idx !== -1) {
      window.projectsData.splice(idx, 1);
      console.log('Removed from window.projectsData, remaining:', window.projectsData.length);
    }

    // Удаляем карточку из DOM
    const cardElement = document.querySelector(`[data-project-id="${projectId}"]`);
    if (cardElement) {
      console.log('Found card element, removing from DOM');
      cardElement.classList.add('deleting');
      setTimeout(() => {
        cardElement.remove();
        console.log('Card removed from DOM');
      }, 300);
    } else {
      console.warn('Card element not found for projectId:', projectId);
    }
    
    // Обновляем счётчики
    updateCounters();
    
    // Если это страница избранного - перерендерим сетку
    if (window.currentView === 'favorites') {
      const favorites = (window.projectsData || []).filter(p => p.fav || p.is_favorite);
      renderProjectsGrid(favorites);
    }
    
    console.log('Project deleted successfully');
  } catch (error) {
    console.error('Delete project error:', error);
    throw error;
  }
}

// ==================== INITIALIZATION ====================

/**
 * Update UI with user stats
 */
async function updateStatsUI() {
  try {
    const projects = await getProjects();
    const favorites = projects.filter(p => p.is_favorite).length;
    const totalGenerations = projects.reduce((sum, p) => sum + (p.generations_count || 0), 0);
    const subscription = await getSubscription();

    // Update all stat elements
    const statsProjects = document.querySelectorAll('#stats-projects, #dash-stats-projects, #sub-stats-projects');
    const statsFavorites = document.querySelectorAll('#stats-favorites, #dash-stats-favorites, #sub-stats-favorites');
    const userNames = document.querySelectorAll('#user-name, #dash-user-name, #sub-user-name');
    const userPlans = document.querySelectorAll('#user-plan, #dash-user-plan, #sub-user-plan');
    const userGenerations = document.querySelectorAll('#user-generations, #dash-user-generations, #sub-user-generations');
    const avatars = document.querySelectorAll('.avatar, #dash-avatar, #sub-avatar');

    statsProjects.forEach(el => {
      if (el) el.textContent = projects.length;
    });

    statsFavorites.forEach(el => {
      if (el) el.textContent = favorites;
    });

    const user = getStoredUser();
    if (user) {
      userNames.forEach(el => {
        if (el) el.textContent = user.name || 'Пользователь';
      });

      avatars.forEach(el => {
        if (el) el.textContent = (user.name || 'П')[0].toUpperCase();
      });
    }

    if (subscription) {
      const planNames = {
        free: 'Бесплатный',
        basic: 'Базовый',
        pro: 'Про'
      };
      const planLimits = {
        free: 3,
        basic: 30,
        pro: '∞'
      };

      const planName = planNames[subscription.plan_type] || 'Бесплатный';
      const limit = planLimits[subscription.plan_type] || 3;
      const used = totalGenerations || 0;

      userPlans.forEach(el => {
        if (el) {
          const generationsSpan = el.querySelector('span[id*="generations"]');
          if (generationsSpan) {
            generationsSpan.textContent = used;
            const limitText = limit === '∞' ? '∞' : limit;
            el.textContent = `${planName} · ${used}/${limitText}`;
          } else {
            el.textContent = `${planName} · ${used}/${limit === '∞' ? '∞' : limit}`;
          }
        }
      });

      userGenerations.forEach(el => {
        if (el) el.textContent = used;
      });

      // Update plan widget
      const planTitle = document.getElementById('dash-plan-title');
      const planSub = document.getElementById('dash-plan-sub');
      const progFill = document.getElementById('dash-prog-fill');

      if (planTitle) planTitle.textContent = `✦ ${planName} план`;
      if (planSub) planSub.textContent = `${used} из ${limit === '∞' ? '∞' : limit} генераций использовано`;
      if (progFill && limit !== '∞') {
        const percentage = Math.min((used / limit) * 100, 100);
        progFill.style.width = `${percentage}%`;
      }
    }
  } catch (error) {
    console.error('Update stats error:', error);
  }
}

/**
 * Update subscription UI
 */
async function updateSubscriptionUI() {
  try {
    await updateStatsUI();
  } catch (error) {
    console.error('Update subscription UI error:', error);
  }
}

/**
 * Update user UI
 */
function updateUserUI() {
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  const user = getStoredUser();

  if (isAuthenticated() && user) {
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';

    // Update stats
    updateStatsUI();
  } else {
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
  }
}

// ==================== LOGO EDITOR API ====================

/**
 * Get specific logo data for editor
 */
async function getLogo(logoId) {
  const response = await authFetch(`${API_BASE_URL}/api/logos/${logoId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get logo');
  }

  const data = await response.json();
  console.log('Logo data loaded:', data);
  return data;
}

/**
 * Update logo settings (font, background, selection)
 */
async function updateLogo(logoId, updateData) {
  const response = await authFetch(`${API_BASE_URL}/api/logos/${logoId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update logo');
  }

  const data = await response.json();
  console.log('Logo updated:', data);
  return data;
}

/**
 * Save logo as draft
 */
async function saveLogoDraft(logoId, updateData = {}) {
  const response = await authFetch(`${API_BASE_URL}/api/logos/${logoId}/draft`, {
    method: 'POST',
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save draft');
  }

  const data = await response.json();
  console.log('Logo saved as draft:', data);
  return data;
}

/**
 * Get all logos for a project
 */
async function getProjectLogos(projectId) {
  const response = await authFetch(`${API_BASE_URL}/api/logos/project/${projectId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get project logos');
  }

  const data = await response.json();
  console.log('Project logos loaded:', data.count, 'logos');
  return data.logos;
}

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
      updateUserUI();
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
  downloadProject,
  showDeleteModal,
  updateCounters,
  updateSubscriptionUI,
  updateUserUI,
  // Logo editor API
  getLogo,
  updateLogo,
  saveLogoDraft,
  getProjectLogos,
};

// Export functions for global use
window.updateStatsUI = updateStatsUI;
window.updateSubscriptionUI = updateSubscriptionUI;
window.updateUserUI = updateUserUI;
window.updateCounters = updateCounters;
window.showDeleteModal = showDeleteModal;
window.downloadProject = downloadProject;