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

  // Create AbortController for timeout (180 seconds)
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    console.warn('authFetch timeout after 180 seconds for:', url);
    controller.abort();
  }, 180000); // 180 seconds timeout

  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  clearTimeout(timeout);

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

// ==================== EDITOR ====================

/**
 * Open logo in editor
 */
function openEditor(logoId) {
  if (!logoId) {
    console.error('openEditor: No logo ID provided');
    toast('Ошибка: не указан ID логотипа');
    return;
  }

  console.log('openEditor called with logoId:', logoId);

  try {
    // Show editor view without changing URL
    const showFunction = window.showView || window.show;
    if (typeof showFunction === 'function') {
      console.log('Calling show editor function');
      showFunction('editor');
    } else {
      console.error('show function not available');
      toast('Ошибка при открытии редактора');
      return;
    }
  } catch (error) {
    console.error('openEditor error:', error);
    toast('Ошибка при открытии редактора: ' + error.message);
  }
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
async function startGeneration(params) {
  // Normalize colors to hex format
  if (params.colors && Array.isArray(params.colors)) {
    params.colors = params.colors.map(color => normalizeColor(color));
  }
  
  console.log('startGeneration payload:', JSON.stringify(params, null, 2));
  
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

  console.log('getWizardParams collected:', {
    brandName,
    niche,
    style,
    colors,
    textPrompt,
    numVariants: 4
  });

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
  if (!rgb) return null;
  
  // Already hex
  if (rgb.startsWith('#')) return rgb;
  
  // Try to parse rgb(r, g, b)
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (match) {
    const hex = (x) => {
      const hexValue = parseInt(x).toString(16);
      return hexValue.length === 1 ? '0' + hexValue : hexValue;
    };
    return '#' + hex(match[1]) + hex(match[2]) + hex(match[3]);
  }
  
  console.warn('Unknown color format:', rgb);
  return rgb; // Return as-is if unknown format
}

/**
 * Ensure color is in hex format
 */
function normalizeColor(color) {
  if (!color) return '#C68DFF';
  
  // Already hex
  if (color.startsWith('#')) return color;
  
  // Try to parse rgb(r, g, b)
  const match = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (match) {
    const hex = (x) => {
      const hexValue = parseInt(x).toString(16);
      return hexValue.length === 1 ? '0' + hexValue : hexValue;
    };
    return '#' + hex(match[1]) + hex(match[2]) + hex(match[3]);
  }
  
  // Try to parse rgba(r, g, b, a)
  const rgbaMatch = color.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)$/);
  if (rgbaMatch) {
    const hex = (x) => {
      const hexValue = parseInt(x).toString(16);
      return hexValue.length === 1 ? '0' + hexValue : hexValue;
    };
    return '#' + hex(rgbaMatch[1]) + hex(rgbaMatch[2]) + hex(rgbaMatch[3]);
  }
  
  console.warn('Unknown color format:', color);
  return color; // Return as-is if unknown format
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
      
      // Open editor with first logo
      setTimeout(() => {
        const firstLogoId = logos[0]?.id;
        if (firstLogoId) {
          console.log('Opening editor with logo:', firstLogoId);
          window.openEditor(firstLogoId);
        } else {
          toast('Ошибка: логотип не найден');
          show('gen');
        }
      }, 500);
      return;
    }

    // If mock generation (no predictionId), fetch from project
    if (!predictionId) {
      console.log('Mock generation complete, fetching project:', projectId);
      const project = await getProject(projectId);
      console.log('Project data:', project);
      console.log('Rendering logos:', project.logos);
      
      // Open editor with first logo
      const firstLogoId = project.logos?.[0]?.id;
      if (firstLogoId) {
        console.log('Opening editor with logo:', firstLogoId);
        window.openEditor(firstLogoId);
      } else {
        toast('Ошибка: логотип не найден');
        show('gen');
      }
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

          // Open editor with first logo
          setTimeout(async () => {
            const project = await getProject(projectId);
            console.log('Rendering logos:', project.logos);

            const firstLogoId = project.logos?.[0]?.id;
            if (firstLogoId) {
              console.log('Opening editor with logo:', firstLogoId);
              window.openEditor(firstLogoId);
            } else {
              toast('Ошибка: логотип не найден');
              show('gen');
            }
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
     const projects = window.projectsData || [];

     // Get all logos from projects
     const allLogos = projects.flatMap(p => p.logos || []);

     // Count logos by status
     const draftLogos = allLogos.filter(l => l.status === 'draft').length;
     const readyLogos = allLogos.filter(l => l.status === 'ready').length;

     const totalProjects = projects.length;
     const doneProjects = projects.filter(p => p.status === 'done').length;
     const favoriteProjects = projects.filter(p => p.isFavorite).length;

     document.querySelectorAll('[data-counter="total"]').forEach(el => {
       el.textContent = `· ${totalProjects}`;
     });

     document.querySelectorAll('[data-counter="drafts"]').forEach(el => {
       el.textContent = `· ${draftLogos}`;
     });

     document.querySelectorAll('[data-counter="done"]').forEach(el => {
       el.textContent = `· ${readyLogos}`;
     });

      document.querySelectorAll('#stats-projects, #dash-stats-projects, #sub-stats-projects, #fav-stats-projects').forEach(el => {
        el.textContent = totalProjects;
      });

      document.querySelectorAll('#stats-favorites, #dash-stats-favorites, #sub-stats-favorites, #fav-stats-favorites').forEach(el => {
        el.textContent = favoriteProjects;
      });

     console.log('Counters updated:', { totalProjects, draftLogos, readyLogos, favoriteProjects });
   } catch (error) {
     console.error('Update counters error:', error);
   }
 }

/**
 * Load projects for dashboard
 */
async function loadDashboardProjects() {
   // Удалено: renderProjectsGrid теперь в index.html
   // Функция загружает проекты и обновляет данные
   try {
     const projects = await getProjects();
     window.projectsData = projects;
     updateCounters();
   } catch (error) {
     console.error('Load projects error:', error);
     toast('Ошибка при загрузке проектов');
   }
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

// ═══════════════════════════════════════════════════════════════
// REMOVE: downloadProject function
// ═══════════════════════════════════════════════════════════════

// Удалено: функции showDeleteModal, closeModal, deleteProject из frontend-api.js
// Эти функции теперь реализованы в index.html для согласованности

// ==================== LOGOS ====================

/**
 * Get logo by ID
 */
async function getLogo(logoId) {
  console.log('getLogo called with logoId:', logoId);
  
  const response = await authFetch(`${API_BASE_URL}/api/logos/${logoId}`);

  if (!response.ok) {
    console.error('getLogo failed with status:', response.status);
    const errorText = await response.text();
    console.error('Error text:', errorText);
    throw new Error(`Failed to get logo: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('getLogo response data:', JSON.stringify(data, null, 2));
  
  // Возвращаем логотип напрямую, проверяем структуру
  if (data.logo) {
    return data.logo;
  }
  
  // Если логотип возвращается напрямую в объекте data
  if (data.id) {
    return data;
  }
  
  // Если нет данных логотипа, выбрасываем ошибку
  console.error('No logo data in response:', data);
  throw new Error('Invalid logo data structure');
}

/**
 * Update logo editor settings
 */
async function updateLogo(logoId, updates) {
  const response = await authFetch(`${API_BASE_URL}/api/logos/${logoId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update logo');
  }

  const data = await response.json();
  return data;
}

/**
 * Save logo as draft
 */
async function saveLogoDraft(logoId) {
  const response = await authFetch(`${API_BASE_URL}/api/logos/${logoId}/draft`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to save draft');
  }

  const data = await response.json();
  return data;
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

// Initialization is handled in index.html
// to avoid duplicate initialization

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
  updateCounters,
  updateSubscriptionUI,
  updateUserUI,
  getLogo,
  updateLogo,
  saveLogoDraft,
  openEditor,
};

// Export individual functions for direct use
window.updateStatsUI = updateStatsUI;
window.updateSubscriptionUI = updateSubscriptionUI;
window.updateUserUI = updateUserUI;
window.updateCounters = updateCounters;
window.isAuthenticated = isAuthenticated;
window.openEditor = openEditor;
window.getToken = getToken;

// Export API base URL
window.API_BASE_URL = API_BASE_URL;

// Also export api globally without window prefix for compatibility
window.apiGlobal = window.api;