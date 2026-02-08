document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. КОНФИГУРАЦИЯ
    // ==========================================
    let config = JSON.parse(localStorage.getItem('sakuraConfig')) || {
        color: '#ff0055', petals: true, gridSize: 220, petalSize: 10
    };
    
    let filters = { search: '', status: 'all', sort: 'default' };
    let petalInterval = null;
    const petalContainer = document.getElementById('background-animation');
    const settingsOverlay = document.getElementById('settings-overlay');

    // ==========================================
    // 2. ПЛАВНЫЕ ПЕРЕХОДЫ
    // ==========================================
    setTimeout(() => document.body.classList.add('loaded'), 50);

    window.navigateTo = function(url) {
        if (!url || url.startsWith('#')) return;
        document.body.classList.remove('loaded');
        document.body.classList.add('exiting');
        setTimeout(() => window.location.href = url, 600);
    };

    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.getAttribute('href') && !link.getAttribute('href').startsWith('#') && link.target !== '_blank') {
            e.preventDefault();
            window.navigateTo(link.getAttribute('href'));
        }
    });

    // ==========================================
    // 3. ПРИМЕНЕНИЕ НАСТРОЕК
    // ==========================================
    function applyConfig() {
        document.documentElement.style.setProperty('--primary', config.color);
        document.querySelectorAll('.color-option').forEach(btn => btn.classList.toggle('active', btn.dataset.color === config.color));
        
        const grid = document.getElementById('anime-grid');
        if (grid) grid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${config.gridSize}px, 1fr))`;

        const inputs = {
            grid: document.getElementById('grid-size'),
            petalToggle: document.getElementById('petal-toggle'),
            petalSize: document.getElementById('petal-size')
        };
        if(inputs.grid) inputs.grid.value = config.gridSize;
        if(inputs.petalToggle) inputs.petalToggle.checked = config.petals;
        if(inputs.petalSize) inputs.petalSize.value = config.petalSize;

        managePetals();
    }

    function managePetals() {
        if (!petalContainer) return;
        clearInterval(petalInterval);
        if (config.petals) {
            petalInterval = setInterval(() => {
                const petal = document.createElement('div');
                petal.classList.add('petal');
                petal.style.left = Math.random() * 100 + 'vw';
                const size = Math.random() * 5 + parseInt(config.petalSize);
                petal.style.width = size + 'px';
                petal.style.height = size + 'px';
                const duration = Math.random() * 5 + 5;
                petal.style.animationDuration = duration + 's';
                petalContainer.appendChild(petal);
                setTimeout(() => petal.remove(), duration * 1000);
            }, 400);
        } else {
            petalContainer.innerHTML = '';
        }
    }

    function saveConfig() {
        localStorage.setItem('sakuraConfig', JSON.stringify(config));
        applyConfig();
    }

    // ==========================================
    // 4. ЛОГИКА КАТАЛОГА (ФИКС ОШИБОК)
    // ==========================================
    const grid = document.getElementById('anime-grid');

    function updateGrid() {
        if (!grid) return;

        // ПРОВЕРКА: Подключен ли db.js?
        if (typeof animeData === 'undefined') {
            grid.innerHTML = '<h2 style="color:red; text-align:center; grid-column:1/-1;">ОШИБКА: Не найден файл js/db.js! Проверь подключение.</h2>';
            return;
        }

        // 1. Фильтрация
        let result = animeData.filter(anime => {
            const matchesSearch = anime.title.toLowerCase().includes(filters.search.toLowerCase());
            const matchesStatus = filters.status === 'all' || anime.status === filters.status;
            return matchesSearch && matchesStatus;
        });

        // 2. Сортировка
        if (filters.sort === 'rating') {
            result.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        }

        // 3. Отрисовка
        grid.innerHTML = '';
        if (result.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
                    <i class="fa-solid fa-ghost" style="font-size: 3rem; color: #444; margin-bottom: 20px;"></i>
                    <h3 style="color:#777;">Ничего не найдено</h3>
                </div>`;
            return;
        }

        result.forEach(anime => {
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => window.navigateTo(`watch.html?id=${anime.id}`);
            
            card.innerHTML = `
                <div class="card-image">
                    <img src="${anime.poster}" alt="${anime.title}" loading="lazy">
                    <div class="rating-badge"><i class="fa-solid fa-star"></i> ${anime.rating}</div>
                    <div class="card-overlay"><div class="play-btn"><i class="fa-solid fa-play"></i></div></div>
                </div>
                <div class="card-content">
                    <h3>${anime.title}</h3>
                    <div style="display:flex; justify-content:space-between; color:#aaa; font-size:0.8rem; font-weight:700;">
                        <span style="color:${anime.status === 'ongoing' ? 'var(--primary)' : 'inherit'}">
                            ${anime.status === 'ongoing' ? 'ОНГОИНГ' : 'FULL'}
                        </span>
                        <span>${anime.episodes}</span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // ==========================================
    // 5. СОБЫТИЯ
    // ==========================================
    
    // --- Поиск ---
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('search');
        if (query && grid) {
            searchInput.value = query;
            filters.search = query;
        }
        searchInput.addEventListener('input', (e) => {
            if (grid) { filters.search = e.target.value; updateGrid(); }
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !grid) {
                const val = e.target.value.trim();
                if (val) window.navigateTo(`popular.html?search=${val}`);
            }
        });
    }

    // --- Фильтры ---
    const filterBtn = document.getElementById('filter-btn');
    const filterPanel = document.getElementById('filter-panel');
    if (filterBtn && filterPanel) {
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterPanel.classList.toggle('active');
        });
        window.addEventListener('click', (e) => {
            if (!filterPanel.contains(e.target) && e.target !== filterBtn) {
                filterPanel.classList.remove('active');
            }
        });
        document.querySelectorAll('input[name="status"]').forEach(r => {
            r.addEventListener('change', (e) => { filters.status = e.target.value; updateGrid(); });
        });
        document.querySelectorAll('input[name="sort"]').forEach(r => {
            r.addEventListener('change', (e) => { filters.sort = e.target.value; updateGrid(); });
        });
    }

    // --- Настройки ---
    const toggleSettings = (show) => {
        if(show) settingsOverlay.classList.add('active');
        else { settingsOverlay.classList.remove('active'); saveConfig(); }
    };

    document.getElementById('open-settings')?.addEventListener('click', () => toggleSettings(true));
    document.getElementById('close-settings')?.addEventListener('click', () => toggleSettings(false));
    document.getElementById('close-settings-x')?.addEventListener('click', () => toggleSettings(false));
    settingsOverlay?.addEventListener('click', (e) => { if(e.target === settingsOverlay) toggleSettings(false); });

    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => { config.color = btn.dataset.color; applyConfig(); });
    });
    document.getElementById('petal-toggle')?.addEventListener('change', (e) => { config.petals = e.target.checked; applyConfig(); });
    document.getElementById('petal-size')?.addEventListener('input', (e) => { config.petalSize = e.target.value; applyConfig(); });
    document.getElementById('grid-size')?.addEventListener('input', (e) => { config.gridSize = e.target.value; applyConfig(); });

    // --- Плеер ---
    const playerFrame = document.getElementById('player-frame');
    if (playerFrame && typeof animeData !== 'undefined') {
        const id = new URLSearchParams(window.location.search).get('id');
        const anime = animeData.find(a => a.id === id);
        if (anime) {
            document.title = `Смотреть ${anime.title}`;
            document.getElementById('anime-title').textContent = anime.title;
            const desc = document.getElementById('anime-desc');
            if(desc) desc.textContent = `Рейтинг: ${anime.rating} | Эпизоды: ${anime.episodes}`;
            playerFrame.innerHTML = `<iframe src="${anime.link}" allow="autoplay *; fullscreen *" style="width:100%;height:100%;border:none;"></iframe>`;
        }
    }

    // Инициализация
    applyConfig();
    if (grid) updateGrid();
});

// Фикс Safari/Chrome Cache
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        document.body.classList.remove('exiting');
        document.body.classList.add('loaded');
    }
});