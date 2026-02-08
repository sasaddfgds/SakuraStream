document.addEventListener('DOMContentLoaded', () => {
    // 1. Получаем ID из ссылки (например, ?id=solo-leveling)
    const params = new URLSearchParams(window.location.search);
    const animeId = params.get('id');

    // 2. Если ID нет, кидаем на главную
    if (!animeId) {
        window.location.href = 'index.html';
        return;
    }

    // 3. Ищем аниме в базе. ВАЖНО: Если db.js сломан, тут скрипт умрет.
    if (typeof animeData === 'undefined') {
        console.error('ОШИБКА: animeData не найдена. Проверь файл db.js!');
        document.getElementById('anime-title').textContent = 'Ошибка базы данных';
        return;
    }

    const anime = animeData.find(a => a.id === animeId);

    // 4. Если аниме с таким ID нет в базе
    if (!anime) {
        document.querySelector('.watch-container').innerHTML = '<h1 style="text-align:center; color:white;">Аниме не найдено</h1>';
        return;
    }

    // 5. Если всё ок — заполняем страницу
    document.title = `Смотреть ${anime.title} | Sakura Stream`;
    
    const titleEl = document.getElementById('anime-title');
    if (titleEl) titleEl.textContent = anime.title;
    
    const ratingEl = document.getElementById('anime-rating');
    if (ratingEl) ratingEl.innerHTML = `<i class="fa-solid fa-star"></i> ${anime.rating}`;
    
    const episodesEl = document.getElementById('anime-episodes');
    if (episodesEl) episodesEl.textContent = anime.episodes + ' EP';
    
    const statusEl = document.getElementById('anime-status');
    if (statusEl) {
        statusEl.textContent = anime.status === 'ongoing' ? 'ONGOING' : 'FULL';
        statusEl.className = `status-tag ${anime.status}`;
    }

    const descEl = document.getElementById('anime-desc');
    if (descEl) descEl.textContent = `Смотрите онлайн аниме "${anime.title}" в высоком качестве. Наслаждайтесь просмотром на Sakura Stream.`;

    // 6. Вставляем плеер
    const playerContainer = document.getElementById('player-frame');
    if (playerContainer) {
        playerContainer.innerHTML = `
            <iframe 
                src="${anime.link}" 
                width="100%" 
                height="100%" 
                frameborder="0" 
                allowfullscreen 
                allow="autoplay *; fullscreen *">
            </iframe>
        `;
    }
});