// Main Application Entry Point
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Custom Video Player
  window.CustomPlayer.init();

  const COMMENTS_STORAGE_KEY = 'movie_streaming_comments';
  const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop';
  const AVATAR_PRESETS = [
    { value: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop', label: 'Classic' },
    { value: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop', label: 'Smiling' },
    { value: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop', label: 'Casual' },
    { value: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop', label: 'Cool' },
    { value: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=100&auto=format&fit=crop', label: 'Soft' },
    { value: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop', label: 'Bright' }
  ];

  function saveComments(comments) {
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
  }

  function loadComments() {
    try {
      return JSON.parse(localStorage.getItem(COMMENTS_STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  // App State
  const state = {
    currentView: 'home', // 'home', 'watchlist', 'search', 'watch'
    activeMovie: null,
    movies: window.MOVIES_DATA || [],
    watchlist: window.WatchlistManager.get(),
    commentsByMovie: loadComments() // Store comments per movie ID
  };

  // DOM Elements
  const header = document.querySelector('header');
  const navItems = document.querySelectorAll('.nav-links li');
  const searchInput = document.querySelector('#header-search');
  const lightMask = document.getElementById('light-mask');
  const authModalOverlay = document.getElementById('auth-modal-overlay');
  const adminModalOverlay = document.getElementById('admin-modal-overlay');
  
  const views = {
    home: document.getElementById('home-view'),
    watchlist: document.getElementById('watchlist-view'),
    search: document.getElementById('search-view'),
    watch: document.getElementById('watch-view')
  };

  // Init App
  init();

  function init() {
    setupNavigation();
    setupHeroSection();
    renderCarousels();
    setupSearch();
    setupWatchlistPage();
    setupWatchViewEvents();
    setupAuthUI();
    setupAdminUI();
    renderAdminMovies();

    // Listen for watchlist changes to live-update the UI
    window.WatchlistManager.onChange((updatedWatchlist) => {
      state.watchlist = updatedWatchlist;
      renderWatchlistCarousel();
      renderWatchlistPage();
      updateHeroWatchlistBtn();
      
      // Update details modal watchlist state
      if (state.activeMovie) {
        updateModalWatchlistBtn();
      }
      
      // Update watch page watchlist button state
      updateWatchPageWatchlistBtn();
    });

    // Window scroll event for header styling
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

    // Handle light mask click to turn lights back on
    lightMask.addEventListener('click', () => {
      toggleLights(false);
    });
  }

  // View Switching Router
  function switchView(viewName) {
    if (!views[viewName]) return;
    
    // Stop video playback if navigating away from watch view
    if (state.currentView === 'watch' && viewName !== 'watch') {
      window.CustomPlayer.close();
      toggleLights(false); // Turn lights back on
    }

    state.currentView = viewName;
    
    // Toggle active view in DOM
    Object.keys(views).forEach(key => {
      if (key === viewName) {
        views[key].classList.add('active');
      } else {
        views[key].classList.remove('active');
      }
    });

    // Update active state in Navigation Links
    navItems.forEach(li => {
      const link = li.querySelector('a');
      if (link && link.dataset.view === viewName) {
        li.classList.add('active');
      } else {
        li.classList.remove('active');
      }
    });

    // Clear search bar if switching away from search
    if (viewName !== 'search') {
      searchInput.value = '';
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setupAuthUI() {
    const profileBtn = document.getElementById('user-profile-btn');
    const adminBtn = document.getElementById('admin-panel-btn');
    const authCloseBtn = document.getElementById('auth-close-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authStatus = document.getElementById('auth-status');
    const accountPanel = document.getElementById('account-panel');
    const profileLabel = document.getElementById('profile-btn-label');
    const openAdminBtn = document.getElementById('open-admin-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const saveAvatarBtn = document.getElementById('save-avatar-btn');
    const accountAvatarPreview = document.getElementById('account-avatar-preview');
    const accountAvatarInput = document.getElementById('account-avatar-url');
    const registerAvatarInput = document.getElementById('register-avatar-url');

    const storageKey = 'movie_streaming_auth';
    const adminStorageKey = 'movie_streaming_admin';

    function saveUsers(users) {
      localStorage.setItem(storageKey, JSON.stringify(users));
    }

    function getUsers() {
      try {
        return JSON.parse(localStorage.getItem(storageKey)) || [];
      } catch {
        return [];
      }
    }

    function ensureDefaultAdmin() {
      const users = getUsers();
      if (!users.some(user => user.username === 'admin')) {
        users.push({ id: 'admin-default', username: 'admin', email: 'admin@webseg.com', password: 'admin123', role: 'admin', avatar: DEFAULT_AVATAR_URL });
        saveUsers(users);
      }
    }

    function getCurrentUser() {
      try {
        return JSON.parse(localStorage.getItem('movie_streaming_current_user'));
      } catch {
        return null;
      }
    }

    function setCurrentUser(user) {
      const normalizedUser = { ...user, avatar: user?.avatar || DEFAULT_AVATAR_URL };
      const users = getUsers();
      const index = users.findIndex(existing => existing.id === normalizedUser.id || existing.username === normalizedUser.username);
      if (index >= 0) {
        users[index] = { ...users[index], ...normalizedUser };
        saveUsers(users);
      }
      localStorage.setItem('movie_streaming_current_user', JSON.stringify(normalizedUser));
      updateAuthUI();
    }

    function clearCurrentUser() {
      localStorage.removeItem('movie_streaming_current_user');
      updateAuthUI();
    }

    function getUserAvatar(user) {
      return user?.avatar || DEFAULT_AVATAR_URL;
    }

    function renderAvatarOptions(containerId, selectedAvatar) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = AVATAR_PRESETS.map(option => `
        <button type="button" class="avatar-option ${selectedAvatar === option.value ? 'active' : ''}" data-avatar="${option.value}" aria-label="${option.label}">
          <img src="${option.value}" alt="${option.label}">
        </button>
      `).join('');

      container.querySelectorAll('.avatar-option').forEach(button => {
        button.addEventListener('click', () => {
          const avatarValue = button.dataset.avatar;
          if (containerId === 'account-avatar-options') {
            if (accountAvatarInput) accountAvatarInput.value = avatarValue;
            if (accountAvatarPreview) {
              accountAvatarPreview.innerHTML = `<img src="${avatarValue}" alt="avatar">`;
            }
          } else if (registerAvatarInput) {
            registerAvatarInput.value = avatarValue;
          }
          renderAvatarOptions(containerId, avatarValue);
        });
      });
    }

    function updateAccountAvatarPreview(avatarUrl) {
      if (accountAvatarPreview) {
        accountAvatarPreview.innerHTML = `<img src="${avatarUrl}" alt="avatar">`;
      }
    }

    function saveAvatarForCurrentUser(avatarUrl) {
      const currentUser = getCurrentUser();
      if (!currentUser) return;
      const nextUser = { ...currentUser, avatar: avatarUrl || DEFAULT_AVATAR_URL };
      const users = getUsers();
      const index = users.findIndex(existing => existing.id === currentUser.id || existing.username === currentUser.username);
      if (index >= 0) {
        users[index] = { ...users[index], avatar: nextUser.avatar };
        saveUsers(users);
      }
      localStorage.setItem('movie_streaming_current_user', JSON.stringify(nextUser));
      updateAuthUI();
    }

    function updateAuthUI() {
      const currentUser = getCurrentUser();
      const isAdmin = currentUser?.role === 'admin';
      profileLabel.textContent = currentUser ? currentUser.username : 'Đăng nhập';
      const profileImg = profileBtn.querySelector('img');
      if (profileImg) {
        profileImg.src = currentUser ? getUserAvatar(currentUser) : DEFAULT_AVATAR_URL;
        profileImg.alt = currentUser ? currentUser.username : 'User avatar';
      }
      accountPanel.style.display = currentUser ? 'block' : 'none';
      adminBtn.style.display = isAdmin ? 'inline-flex' : 'none';
      document.getElementById('comment-submit-action').disabled = !currentUser;
      document.getElementById('comment-textarea').disabled = !currentUser;
      document.getElementById('comment-textarea').placeholder = currentUser ? 'Chia sẻ suy nghĩ của bạn...' : 'Đăng nhập để chia sẻ suy nghĩ...';
      document.getElementById('comment-auth-note').textContent = currentUser ? `Đăng nhập với ${currentUser.username}` : 'Đăng nhập để bình luận';
      const commentBtn = document.getElementById('comment-submit-action');
      if (commentBtn) {
        commentBtn.textContent = currentUser ? 'Gửi bình luận' : 'Gửi bình luận';
      }
      const accountName = document.getElementById('account-name');
      const accountRole = document.getElementById('account-role');
      if (accountName) accountName.textContent = currentUser ? currentUser.username : 'Khách';
      if (accountRole) accountRole.textContent = isAdmin ? 'Quản trị viên' : 'Thành viên';
      if (openAdminBtn) openAdminBtn.style.display = isAdmin ? 'inline-flex' : 'none';
      if (currentUser) {
        renderAvatarOptions('register-avatar-options', registerAvatarInput?.value || DEFAULT_AVATAR_URL);
        renderAvatarOptions('account-avatar-options', getUserAvatar(currentUser));
        updateAccountAvatarPreview(getUserAvatar(currentUser));
        if (accountAvatarInput) accountAvatarInput.value = getUserAvatar(currentUser);
      } else {
        renderAvatarOptions('register-avatar-options', registerAvatarInput?.value || DEFAULT_AVATAR_URL);
        if (accountAvatarInput) accountAvatarInput.value = '';
        if (accountAvatarPreview) accountAvatarPreview.innerHTML = '';
      }

      const authTabsContainer = document.querySelector('.auth-tabs');
      if (authTabsContainer) {
        authTabsContainer.style.display = currentUser ? 'none' : 'flex';
      }
      if (currentUser) {
        loginForm.classList.remove('active');
        registerForm.classList.remove('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        authStatus.style.display = 'none';
      } else {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        loginForm.style.display = '';
        registerForm.style.display = '';
        authStatus.style.display = '';
      }
    }

    profileBtn.addEventListener('click', () => {
      authModalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      updateAuthUI();
    });

    authCloseBtn.addEventListener('click', closeAuthModal);
    authModalOverlay.addEventListener('click', (e) => {
      if (e.target === authModalOverlay) closeAuthModal();
    });

    function closeAuthModal() {
      authModalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    authTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.dataset.authMode;
        document.getElementById('login-form').classList.toggle('active', mode === 'login');
        document.getElementById('register-form').classList.toggle('active', mode === 'register');
      });
    });

    saveAvatarBtn?.addEventListener('click', () => {
      const avatarUrl = accountAvatarInput?.value.trim() || DEFAULT_AVATAR_URL;
      saveAvatarForCurrentUser(avatarUrl);
    });

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const users = getUsers();
      const found = users.find(user => user.username === username && user.password === password);
      if (!found) {
        authStatus.textContent = 'Tên đăng nhập hoặc mật khẩu không đúng.';
        return;
      }
      setCurrentUser(found);
      loginForm.reset();
      authStatus.textContent = 'Đăng nhập thành công!';
      closeAuthModal();
      renderComments(state.activeMovie?.id);
    });

    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('register-username').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;
      const confirm = document.getElementById('register-confirm').value;
      const avatar = (registerAvatarInput?.value || '').trim() || DEFAULT_AVATAR_URL;
      const users = getUsers();
      if (!username || !email || !password || password !== confirm) {
        authStatus.textContent = 'Vui lòng kiểm tra thông tin đăng ký.';
        return;
      }
      if (users.some(user => user.username === username)) {
        authStatus.textContent = 'Tên đăng nhập đã tồn tại.';
        return;
      }
      const newUser = { id: Date.now().toString(), username, email, password, role: 'member', avatar };
      users.push(newUser);
      saveUsers(users);
      setCurrentUser(newUser);
      registerForm.reset();
      authStatus.textContent = 'Tạo tài khoản thành công!';
      closeAuthModal();
      renderComments(state.activeMovie?.id);
    });

    openAdminBtn.addEventListener('click', () => {
      const currentUser = getCurrentUser();
      if (currentUser?.role !== 'admin') {
        authStatus.textContent = 'Chỉ admin mới có quyền mở bảng quản trị.';
        return;
      }
      adminModalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    logoutBtn.addEventListener('click', () => {
      clearCurrentUser();
      authStatus.textContent = 'Đã đăng xuất.';
      renderComments(state.activeMovie?.id);
    });

    adminBtn.addEventListener('click', () => {
      const currentUser = getCurrentUser();
      if (currentUser?.role !== 'admin') {
        return;
      }
      adminModalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const adminCloseBtn = document.getElementById('admin-close-btn');
    adminCloseBtn.addEventListener('click', closeAdminModal);
    adminModalOverlay.addEventListener('click', (e) => {
      if (e.target === adminModalOverlay) closeAdminModal();
    });

    function closeAdminModal() {
      adminModalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    ensureDefaultAdmin();
    updateAuthUI();
  }

  function setupAdminUI() {
    const movieForm = document.getElementById('movie-form');
    const movieList = document.getElementById('admin-movie-list');
    const movieIdField = document.getElementById('movie-id-field');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    function saveMovies(list) {
      localStorage.setItem('movie_streaming_admin_movies', JSON.stringify(list));
    }

    function getMovies() {
      try {
        return JSON.parse(localStorage.getItem('movie_streaming_admin_movies')) || [];
      } catch {
        return [];
      }
    }

    function syncMoviesToApp() {
      const stored = getMovies();
      if (stored.length) {
        state.movies = stored;
        renderCarousels();
        if (state.activeMovie) {
          const refreshed = stored.find(movie => movie.id === state.activeMovie.id);
          if (refreshed) {
            state.activeMovie = refreshed;
          }
        }
      }
    }

    movieForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const movie = {
        id: movieIdField.value || `movie-${Date.now()}`,
        title: document.getElementById('movie-title').value.trim(),
        genres: document.getElementById('movie-genres').value.split(',').map(item => item.trim()).filter(Boolean),
        description: document.getElementById('movie-description').value.trim(),
        director: document.getElementById('movie-director').value.trim(),
        cast: document.getElementById('movie-cast').value.trim(),
        year: Number(document.getElementById('movie-year').value) || 2026,
        duration: document.getElementById('movie-duration').value.trim(),
        rating: Number(document.getElementById('movie-rating').value) || 8.0,
        poster: document.getElementById('movie-poster').value.trim(),
        backdrop: document.getElementById('movie-backdrop').value.trim(),
        videoUrl: document.getElementById('movie-video').value.trim(),
        featured: false
      };
      const list = getMovies();
      const index = list.findIndex(item => item.id === movie.id);
      if (index >= 0) {
        list[index] = movie;
      } else {
        list.unshift(movie);
      }
      saveMovies(list);
      movieForm.reset();
      movieIdField.value = '';
      syncMoviesToApp();
      renderAdminMovies();
      alert('Đã lưu phim thành công!');
    });

    window.deleteMovieById = function(id) {
      const list = getMovies().filter(movie => movie.id !== id);
      saveMovies(list);
      syncMoviesToApp();
      renderAdminMovies();
    };

    window.editMovieById = function(id) {
      const list = getMovies();
      const movie = list.find(item => item.id === id);
      if (!movie) return;
      document.getElementById('movie-id-field').value = movie.id;
      document.getElementById('movie-title').value = movie.title;
      document.getElementById('movie-genres').value = (movie.genres || []).join(', ');
      document.getElementById('movie-description').value = movie.description || '';
      document.getElementById('movie-director').value = movie.director || '';
      document.getElementById('movie-cast').value = movie.cast || '';
      document.getElementById('movie-year').value = movie.year || '';
      document.getElementById('movie-duration').value = movie.duration || '';
      document.getElementById('movie-rating').value = movie.rating || '';
      document.getElementById('movie-poster').value = movie.poster || '';
      document.getElementById('movie-backdrop').value = movie.backdrop || '';
      document.getElementById('movie-video').value = movie.videoUrl || '';
      document.getElementById('movie-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    cancelEditBtn.addEventListener('click', () => {
      movieForm.reset();
      movieIdField.value = '';
    });

    function renderAdminMovies() {
      const list = getMovies();
      movieList.innerHTML = '';
      if (!list.length) {
        movieList.innerHTML = '<div class="empty-state">Chưa có phim nào trong quản trị.</div>';
        return;
      }
      list.forEach(movie => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
          <div>
            <strong>${movie.title}</strong>
            <div class="info-value">${(movie.genres || []).join(', ') || 'Chưa có thể loại'}</div>
          </div>
          <div class="admin-item-actions">
            <button class="btn btn-secondary" onclick="editMovieById('${movie.id}')">Sửa</button>
            <button class="btn btn-primary" onclick="deleteMovieById('${movie.id}')">Xoá</button>
          </div>
        `;
        movieList.appendChild(item);
      });
    }

    renderAdminMovies();
  }

  // Setup header menu clicks
  function setupNavigation() {
    navItems.forEach(li => {
      const link = li.querySelector('a');
      if (!link) return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        if (view) switchView(view);
      });
    });

    // Logo Click returns to Home
    document.querySelector('.logo').addEventListener('click', (e) => {
      e.preventDefault();
      switchView('home');
    });

    // Breadcrumb Home Link
    document.getElementById('watch-breadcrumb-home').addEventListener('click', (e) => {
      e.preventDefault();
      switchView('home');
    });
  }

  // Play movie in dedicated watch page (instead of full-screen modal)
  function playMovieInWatchView(movie) {
    state.activeMovie = movie;

    // 1. Update breadcrumbs
    document.getElementById('watch-breadcrumb-genre').textContent = movie.genres[0];
    document.getElementById('watch-breadcrumb-title').textContent = movie.title;

    // 2. Populate movie details
    document.getElementById('watch-movie-title-val').textContent = movie.title;
    document.getElementById('watch-rating-val').textContent = movie.rating.toFixed(1);
    document.getElementById('watch-movie-year-val').textContent = movie.year;
    document.getElementById('watch-movie-duration-val').textContent = movie.duration;
    document.getElementById('watch-movie-desc-val').textContent = movie.description;

    // 3. Reset Quick Actions Visual States
    updateWatchPageWatchlistBtn();
    
    const expandBtn = document.getElementById('action-expand');
    expandBtn.innerHTML = '<i class="fas fa-expand-alt"></i> Phóng to';
    expandBtn.classList.remove('active');
    document.getElementById('watch-view').classList.remove('player-expanded');

    // 4. Toggle VIP Server as default active
    resetServerButtons();

    // 5. Populate and render comments list
    renderComments(movie.id);

    // 6. Populate sidebar widgets
    renderSidebarWidgets(movie);

    // 7. Route to Watch View page
    switchView('watch');

    // 8. Open movie in customized video player container
    window.CustomPlayer.open(movie.videoUrl);
  }

  // Server selectors reset
  function resetServerButtons() {
    const serverButtons = document.querySelectorAll('.server-btn');
    serverButtons.forEach(btn => btn.classList.remove('active'));
    document.getElementById('server-vip').classList.add('active');
  }

  // Setup Watch View events (Quick buttons, server buttons, comments submit)
  function setupWatchViewEvents() {
    // Server switching
    const serverButtons = document.querySelectorAll('.server-btn');
    serverButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        serverButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        // Simulate minor loading by restarting video from random spot or resetting
        if (state.activeMovie) {
          const prevTime = window.CustomPlayer.video.currentTime;
          window.CustomPlayer.video.load();
          window.CustomPlayer.video.currentTime = prevTime;
          window.CustomPlayer.video.play().catch(()=>{});
        }
      });
    });

    // Quick Action: Next Episode / Phim Tiếp Theo
    document.getElementById('action-next').addEventListener('click', () => {
      if (!state.activeMovie) return;
      const index = state.movies.findIndex(m => m.id === state.activeMovie.id);
      const nextIndex = (index + 1) % state.movies.length;
      playMovieInWatchView(state.movies[nextIndex]);
    });

    // Quick Action: Comment scroll
    document.getElementById('action-comment').addEventListener('click', () => {
      const form = document.getElementById('comment-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('comment-textarea').focus();
      }
    });

    // Quick Action: Lights toggle / Tắt đèn
    document.getElementById('action-lights').addEventListener('click', () => {
      const active = !lightMask.classList.contains('active');
      toggleLights(active);
    });

    // Quick Action: Watchlist Bookmark
    document.getElementById('action-watchlist').addEventListener('click', () => {
      if (!state.activeMovie) return;
      window.WatchlistManager.toggle(state.activeMovie.id);
    });

    // Quick Action: Phóng To / Expand player columns width
    document.getElementById('action-expand').addEventListener('click', (e) => {
      const watchView = document.getElementById('watch-view');
      watchView.classList.toggle('player-expanded');
      
      const expanded = watchView.classList.contains('player-expanded');
      const btn = e.currentTarget;
      
      if (expanded) {
        btn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i> Thu nhỏ';
        btn.classList.add('active');
      } else {
        btn.innerHTML = '<i class="fas fa-expand-alt"></i> Phóng to';
        btn.classList.remove('active');
      }
    });

    // Quick Action: Screenshot
    document.getElementById('action-screenshot').addEventListener('click', () => {
      takeScreenshot();
    });

    // Quick Action: Download file
    document.getElementById('action-download').addEventListener('click', () => {
      if (state.activeMovie) {
        const link = document.createElement('a');
        link.href = state.activeMovie.videoUrl;
        link.download = `${state.activeMovie.title}.mp4`;
        link.target = '_blank';
        link.click();
      }
    });

    // Comment submission handler
    document.getElementById('comment-form').addEventListener('submit', (e) => {
      e.preventDefault();
      submitComment();
    });
  }

  // Tắt Đèn filter triggers
  function toggleLights(turnOff) {
    const playerContainer = document.getElementById('player-container');
    const lightsBtn = document.getElementById('action-lights');

    if (turnOff) {
      lightMask.classList.add('active');
      playerContainer.classList.add('lights-out');
      lightsBtn.classList.add('active');
      lightsBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Bật đèn';
    } else {
      lightMask.classList.remove('active');
      playerContainer.classList.remove('lights-out');
      lightsBtn.classList.remove('active');
      lightsBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Tắt đèn';
    }
  }

  // Sync Watchlist toggle button state on watch view page
  function updateWatchPageWatchlistBtn() {
    if (!state.activeMovie) return;
    const btn = document.getElementById('action-watchlist');
    if (!btn) return;

    const inList = window.WatchlistManager.has(state.activeMovie.id);
    if (inList) {
      btn.innerHTML = '<i class="fas fa-check"></i> Đã theo dõi';
      btn.classList.add('active');
    } else {
      btn.innerHTML = '<i class="fas fa-bookmark"></i> Theo dõi';
      btn.classList.remove('active');
    }
  }

  // Screenshot generator drawing current video frames on canvas
  function takeScreenshot() {
    const video = window.CustomPlayer.video;
    if (!video || !state.activeMovie) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataURL = canvas.toDataURL('image/jpeg');
      const link = document.createElement('a');
      link.download = `CineStream_${state.activeMovie.title.replace(/\s+/g, '_')}_chup_man_hinh.jpg`;
      link.href = dataURL;
      link.click();
    } catch (err) {
      console.error("Screenshot capture blocked (most likely CORS on public URL):", err);
      alert("Không thể chụp màn hình video này do vấn đề bảo mật CORS của máy chủ chứa tệp.");
    }
  }

  // Render comments for active movie
  function renderComments(movieId) {
    const list = document.getElementById('comments-list');
    list.innerHTML = '';

    // Initialize empty comment list if not present
    if (!state.commentsByMovie[movieId]) {
      state.commentsByMovie[movieId] = [];
    }

    const comments = state.commentsByMovie[movieId];
    const currentUser = JSON.parse(localStorage.getItem('movie_streaming_current_user') || 'null');
    const isAdmin = currentUser?.role === 'admin';

    if (comments.length === 0) {
      list.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 20px 0;">Hãy là người đầu tiên bình luận cho bộ phim này!</div>';
      return;
    }

    comments.forEach((comment, index) => {
      const item = document.createElement('div');
      item.className = 'comment-item';
      item.innerHTML = `
        <img src="${comment.avatar}" alt="${comment.author}" class="comment-avatar">
        <div class="comment-content">
          <div class="comment-header">
            <span class="comment-author">${comment.author}</span>
            <span class="comment-time">${comment.time}</span>
            ${isAdmin ? `<button type="button" class="comment-delete-btn" data-index="${index}">Xóa</button>` : ''}
          </div>
          <p class="comment-text">${comment.text}</p>
        </div>
      `;
      list.appendChild(item);
    });

    if (isAdmin) {
      list.querySelectorAll('.comment-delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          const index = Number(e.currentTarget.dataset.index);
          deleteComment(movieId, index);
        });
      });
    }
  }

  window.deleteComment = function(movieId, commentIndex) {
    if (!state.commentsByMovie[movieId]) return;
    if (commentIndex < 0 || commentIndex >= state.commentsByMovie[movieId].length) return;
    state.commentsByMovie[movieId].splice(commentIndex, 1);
    saveComments(state.commentsByMovie);
    renderComments(movieId);
  };

  // Push comment to array and render
  function submitComment() {
    if (!state.activeMovie) return;
    const textarea = document.getElementById('comment-textarea');
    const text = textarea.value.trim();
    const currentUser = JSON.parse(localStorage.getItem('movie_streaming_current_user') || 'null');
    if (text === '' || !currentUser) return;

    const newComment = {
      author: currentUser.username,
      time: "Vừa xong",
      text: text,
      avatar: currentUser.avatar || DEFAULT_AVATAR_URL
    };

    state.commentsByMovie[state.activeMovie.id].unshift(newComment);
    saveComments(state.commentsByMovie);
    renderComments(state.activeMovie.id);
    textarea.value = '';
  }

  // Build widgets contents
  function renderSidebarWidgets(currentMovie) {
    // 1. Phim mới cập nhật widget
    const updatedList = document.getElementById('sidebar-updated-list');
    updatedList.innerHTML = '';

    // Filter 5 movies excluding current movie
    const recentMovies = state.movies
      .filter(m => m.id !== currentMovie.id)
      .slice(0, 5);

    recentMovies.forEach(movie => {
      const item = document.createElement('li');
      item.className = 'updated-item';
      item.innerHTML = `
        <img src="${movie.poster}" alt="${movie.title}">
        <div class="updated-item-info">
          <div class="updated-item-title">${movie.title}</div>
          <div class="updated-item-meta">
            <span class="updated-item-episode">Tập HD</span>
            <span>&bull;</span>
            <span><i class="fas fa-star" style="color:var(--accent)"></i> ${movie.rating.toFixed(1)}</span>
          </div>
        </div>
      `;
      item.addEventListener('click', () => {
        playMovieInWatchView(movie);
      });
      updatedList.appendChild(item);
    });

    // 2. Random button event listener
    const randomBtn = document.getElementById('btn-random-anime');
    // Reclone to prevent multiple listeners accumulation
    const newRandomBtn = randomBtn.cloneNode(true);
    randomBtn.parentNode.replaceChild(newRandomBtn, randomBtn);
    newRandomBtn.addEventListener('click', () => {
      const otherMovies = state.movies.filter(m => m.id !== currentMovie.id);
      if (otherMovies.length > 0) {
        const randomMovie = otherMovies[Math.floor(Math.random() * otherMovies.length)];
        playMovieInWatchView(randomMovie);
      }
    });
  }

  // Build the cinematic hero section using featured movie
  function setupHeroSection() {
    const featuredMovie = state.movies.find(m => m.featured) || state.movies[0];
    if (!featuredMovie) return;

    const heroSection = document.querySelector('.hero-section');
    const heroBg = heroSection.querySelector('.hero-bg');
    const heroTitle = heroSection.querySelector('.hero-title');
    const heroRating = heroSection.querySelector('.hero-rating-val');
    const heroYear = heroSection.querySelector('.hero-year');
    const heroDuration = heroSection.querySelector('.hero-duration');
    const heroDesc = heroSection.querySelector('.hero-desc');
    const playBtn = heroSection.querySelector('.btn-play-hero');
    const watchlistBtn = heroSection.querySelector('.btn-watchlist-hero');

    // Populate data
    heroBg.style.backgroundImage = `url('${featuredMovie.backdrop}')`;
    heroTitle.textContent = featuredMovie.title;
    heroRating.textContent = featuredMovie.rating.toFixed(1);
    heroYear.textContent = featuredMovie.year;
    heroDuration.textContent = featuredMovie.duration;
    heroDesc.textContent = featuredMovie.description;

    // Play button event - triggers inline watch view page
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playMovieInWatchView(featuredMovie);
    });

    // Watchlist button toggle event
    watchlistBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.WatchlistManager.toggle(featuredMovie.id);
    });

    // Card click on Hero body opens detailed modal
    heroSection.addEventListener('click', () => {
      openDetailsModal(featuredMovie);
    });

    updateHeroWatchlistBtn();
  }

  // Update hero watchlist button visual state
  function updateHeroWatchlistBtn() {
    const featuredMovie = state.movies.find(m => m.featured) || state.movies[0];
    if (!featuredMovie) return;

    const watchlistBtn = document.querySelector('.btn-watchlist-hero');
    if (!watchlistBtn) return;

    const inList = window.WatchlistManager.has(featuredMovie.id);
    if (inList) {
      watchlistBtn.innerHTML = '<i class="fas fa-check"></i> Watchlisted';
      watchlistBtn.style.background = 'rgba(139, 92, 246, 0.2)';
      watchlistBtn.style.borderColor = 'var(--primary)';
    } else {
      watchlistBtn.innerHTML = '<i class="fas fa-plus"></i> My List';
      watchlistBtn.style.background = '';
      watchlistBtn.style.borderColor = '';
    }
  }

  // Setup Carousels for Home View
  function renderCarousels() {
    // 1. Trending Now (Sorted by Rating)
    const trendingMovies = [...state.movies].sort((a, b) => b.rating - a.rating);
    renderCarouselGrid('carousel-trending', trendingMovies);

    // 2. Action & Adventure
    const actionMovies = state.movies.filter(m => m.genres.includes('Action'));
    renderCarouselGrid('carousel-action', actionMovies);

    // 3. Sci-Fi & Cyberpunk
    const scifiMovies = state.movies.filter(m => m.genres.includes('Sci-Fi'));
    renderCarouselGrid('carousel-scifi', scifiMovies);

    // 4. (Drama & Romance removed)

    // 5. Watchlist Carousel
    renderWatchlistCarousel();

    // Bind scroll control buttons
    setupCarouselControls();
  }

  // Renders movies list into a scroll container
  function renderCarouselGrid(containerId, moviesList) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    if (moviesList.length === 0) {
      container.innerHTML = '<div class="empty-carousel-msg">No movies found in this category</div>';
      return;
    }

    moviesList.forEach(movie => {
      const card = createMovieCard(movie);
      container.appendChild(card);
    });
  }

  // Watchlist Carousel (Dynamic rendering)
  function renderWatchlistCarousel() {
    const container = document.getElementById('carousel-watchlist');
    const section = container.closest('.category-section');
    if (!container || !section) return;

    const watchlistIds = window.WatchlistManager.get();
    
    if (watchlistIds.length === 0) {
      section.style.display = 'none'; // Hide section if empty
      return;
    }

    section.style.display = 'block';
    const watchlistMovies = state.movies.filter(m => watchlistIds.includes(m.id));
    renderCarouselGrid('carousel-watchlist', watchlistMovies);
  }

  // Create HTML structure for movie card
  function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.id = movie.id;
    
    card.innerHTML = `
      <img src="${movie.poster}" alt="${movie.title}" loading="lazy">
      <div class="card-rating">
        <i class="fas fa-star"></i> ${movie.rating.toFixed(1)}
      </div>
      <button class="card-play-btn" aria-label="Play ${movie.title}">
        <i class="fas fa-play"></i>
      </button>
      <div class="card-overlay">
        <h3 class="card-title">${movie.title}</h3>
        <div class="card-meta">
          <span>${movie.year}</span>
          <span>&bull;</span>
          <span>${movie.duration}</span>
        </div>
      </div>
    `;

    // Play Button click event - triggers watch view directly
    card.querySelector('.card-play-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      playMovieInWatchView(movie);
    });

    // Card click opens modal details
    card.addEventListener('click', () => {
      openDetailsModal(movie);
    });

    return card;
  }

  // Bind Carousel arrows to click scrolls
  function setupCarouselControls() {
    const categories = document.querySelectorAll('.category-section');
    categories.forEach(section => {
      const leftBtn = section.querySelector('.carousel-btn.left');
      const rightBtn = section.querySelector('.carousel-btn.right');
      const container = section.querySelector('.carousel-container');

      if (!leftBtn || !rightBtn || !container) return;

      // Handle Left Arrow
      leftBtn.addEventListener('click', () => {
        container.scrollBy({ left: -container.clientWidth * 0.75, behavior: 'smooth' });
      });

      // Handle Right Arrow
      rightBtn.addEventListener('click', () => {
        container.scrollBy({ left: container.clientWidth * 0.75, behavior: 'smooth' });
      });

      // Show/Hide buttons based on scrolling
      const toggleButtons = () => {
        leftBtn.disabled = container.scrollLeft <= 5;
        rightBtn.disabled = Math.ceil(container.scrollLeft + container.clientWidth) >= container.scrollWidth - 5;
      };

      container.addEventListener('scroll', toggleButtons);
      window.addEventListener('resize', toggleButtons);
      
      // Initialize states after content loads
      setTimeout(toggleButtons, 100);
    });
  }

  // Detailed Modal Display Functions
  const modalOverlay = document.getElementById('details-modal-overlay');
  const modal = modalOverlay.querySelector('.details-modal');
  const closeBtn = modalOverlay.querySelector('.modal-close-btn');

  function openDetailsModal(movie) {
    state.activeMovie = movie;

    // Populate data
    modalOverlay.querySelector('.modal-hero-bg').style.backgroundImage = `url('${movie.backdrop}')`;
    modalOverlay.querySelector('.modal-poster').src = movie.poster;
    modalOverlay.querySelector('.modal-poster').alt = movie.title;
    modalOverlay.querySelector('.modal-title-area h2').textContent = movie.title;
    modalOverlay.querySelector('.modal-rating-val').textContent = movie.rating.toFixed(1);
    modalOverlay.querySelector('.modal-year').textContent = movie.year;
    modalOverlay.querySelector('.modal-duration').textContent = movie.duration;
    modalOverlay.querySelector('.modal-synopsis-text').textContent = movie.description;
    modalOverlay.querySelector('.info-director').textContent = movie.director;
    modalOverlay.querySelector('.info-cast').textContent = movie.cast;

    // Populate genres
    const genreTagsContainer = modalOverlay.querySelector('.genre-tags');
    genreTagsContainer.innerHTML = '';
    movie.genres.forEach(genre => {
      const tag = document.createElement('span');
      tag.className = 'genre-tag';
      tag.textContent = genre;
      genreTagsContainer.appendChild(tag);
    });

    // Setup action buttons inside modal
    const playBtn = modalOverlay.querySelector('.btn-play-modal');
    // Remove old play listeners (clone is simple way in vanilla JS)
    const newPlayBtn = playBtn.cloneNode(true);
    playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
    newPlayBtn.addEventListener('click', () => {
      closeDetailsModal();
      playMovieInWatchView(movie);
    });

    // Watchlist toggle inside modal
    updateModalWatchlistBtn();
    const watchlistBtn = modalOverlay.querySelector('.btn-watchlist-modal');
    // Remove old watchlist listeners
    const newWatchlistBtn = watchlistBtn.cloneNode(true);
    watchlistBtn.parentNode.replaceChild(newWatchlistBtn, watchlistBtn);
    newWatchlistBtn.addEventListener('click', () => {
      window.WatchlistManager.toggle(movie.id);
    });

    // Populate Similar Movies
    renderSimilarMovies(movie);

    // Display modal
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Lock background scrolling

    // Auto-scroll modal to top
    modal.scrollTop = 0;
  }

  function closeDetailsModal() {
    state.activeMovie = null;
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeDetailsModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeDetailsModal();
  });

  // Watchlist buttons state synchronizer inside detailed modal
  function updateModalWatchlistBtn() {
    if (!state.activeMovie) return;
    const btn = modalOverlay.querySelector('.btn-watchlist-modal');
    if (!btn) return;

    const inList = window.WatchlistManager.has(state.activeMovie.id);
    if (inList) {
      btn.innerHTML = '<i class="fas fa-check"></i> Watchlisted';
      btn.style.background = 'rgba(139, 92, 246, 0.2)';
      btn.style.borderColor = 'var(--primary)';
    } else {
      btn.innerHTML = '<i class="fas fa-plus"></i> Add to Watchlist';
      btn.style.background = '';
      btn.style.borderColor = '';
    }
  }

  // Renders similar movies list (same genres)
  function renderSimilarMovies(currentMovie) {
    const grid = modalOverlay.querySelector('.similar-grid');
    grid.innerHTML = '';

    // Find movies sharing at least one genre, excluding current movie
    const similar = state.movies.filter(m => {
      if (m.id === currentMovie.id) return false;
      return m.genres.some(g => currentMovie.genres.includes(g));
    }).slice(0, 4);

    if (similar.length === 0) {
      grid.innerHTML = '<div style="color: var(--text-dim); grid-column: 1/-1;">No similar movies found.</div>';
      return;
    }

    similar.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'similar-card';
      card.innerHTML = `<img src="${movie.poster}" alt="${movie.title}" loading="lazy">`;
      card.addEventListener('click', () => {
        openDetailsModal(movie);
      });
      grid.appendChild(card);
    });
  }

  // Setup Search functionality
  function setupSearch() {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      
      if (query === '') {
        // Return to Home or Watchlist, depending on previous view
        switchView(state.currentView === 'search' ? 'home' : state.currentView);
        return;
      }

      // Enter search view mode
      switchView('search');

      const resultsGrid = document.getElementById('search-results-grid');
      const emptyState = document.getElementById('search-empty-state');
      const searchTitle = document.getElementById('search-query-title');

      searchTitle.textContent = `Search results for "${query}"`;

      // Filter movies: title, genres, description, cast, director
      const matches = state.movies.filter(movie => {
        return movie.title.toLowerCase().includes(query) ||
               movie.director.toLowerCase().includes(query) ||
               movie.cast.toLowerCase().includes(query) ||
               movie.description.toLowerCase().includes(query) ||
               movie.genres.some(g => g.toLowerCase().includes(query));
      });

      resultsGrid.innerHTML = '';
      if (matches.length === 0) {
        resultsGrid.style.display = 'none';
        emptyState.style.display = 'block';
      } else {
        emptyState.style.display = 'none';
        resultsGrid.style.display = 'grid';
        matches.forEach(movie => {
          const card = createMovieCard(movie);
          resultsGrid.appendChild(card);
        });
      }
    });

    // Prevent search form submission reloading the page
    const searchForm = document.querySelector('.search-box');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => e.preventDefault());
    }
  }

  // Setup Watchlist Page layout
  function setupWatchlistPage() {
    renderWatchlistPage();
  }

  // Build grid of watchlist movies
  function renderWatchlistPage() {
    const grid = document.getElementById('watchlist-grid');
    const emptyState = document.getElementById('watchlist-empty-state');
    if (!grid || !emptyState) return;

    const watchlistIds = window.WatchlistManager.get();
    grid.innerHTML = '';

    if (watchlistIds.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      grid.style.display = 'grid';

      const watchlistMovies = state.movies.filter(m => watchlistIds.includes(m.id));
      watchlistMovies.forEach(movie => {
        const card = createMovieCard(movie);
        grid.appendChild(card);
      });
    }
  }
});
