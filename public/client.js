// Center of McKeldin Mall
const center = [38.986013649261004, -76.9425051267938]

// Lock the user to a 1-mile radius around McKeldin
const bounds = L.latLng(center).toBounds(1 * 1609 * 2);

const map = L.map('map', { maxBounds: bounds, maxBoundsViscosity: 1.0 }).setView(center, 18);
const commentTextarea = document.querySelector('.comment-form > textarea');

function resizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}

function createStarRatingComponent({ defaultValue = 0, canEdit = false, size = 24 } = {}) {
    const starRatingContainer = document.createElement('div');
    starRatingContainer.className = canEdit ? 'star-rating is-editable' : 'star-rating is-readonly';
    starRatingContainer.style.setProperty('--star-size', `${size}px`);

    const ratingInput = document.createElement('input');
    ratingInput.type = 'hidden';
    ratingInput.name = 'rating';
    ratingInput.value = defaultValue > 0 ? String(defaultValue) : '';

    const starButtons = [];
    let currentRating = defaultValue;
    let hoverRating = 0;

    function renderRating(nextRating) {
        ratingInput.value = nextRating > 0 ? String(nextRating) : '';

        starButtons.forEach((button, index) => {
            const starValue = index + 1;

            button.classList.remove('is-empty', 'is-half', 'is-full');

            if (nextRating >= starValue) {
                button.classList.add('is-full');
                button.setAttribute('aria-pressed', 'true');
            } else if (nextRating >= starValue - 0.5) {
                button.classList.add('is-half');
                button.setAttribute('aria-pressed', 'true');
            } else {
                button.classList.add('is-empty');
                button.setAttribute('aria-pressed', 'false');
            }
        });
    }

    function setHoverRating(nextRating) {
        if (!canEdit) return;

        hoverRating = nextRating;
        renderRating(hoverRating || currentRating);
    }

    function clearHoverRating() {
        if (!canEdit) return;

        hoverRating = 0;
        renderRating(currentRating);
    }

    for (let i = 1; i <= 5; i++) {
        const starButton = document.createElement(canEdit ? 'button' : 'span');
        if (canEdit) {
            starButton.type = 'button';
        }
        starButton.className = 'rating-star is-empty';
        starButton.setAttribute('aria-label', `${i} star`);
        starButton.setAttribute('aria-pressed', 'false');
        starButton.textContent = '★';

        if (canEdit) {
            starButton.addEventListener('click', event => {
                const bounds = starButton.getBoundingClientRect();
                const clickedHalf = event.clientX < bounds.left + bounds.width / 2;
                const nextRating = clickedHalf ? i - 0.5 : i;

                currentRating = nextRating;
                renderRating(currentRating);
            });

            starButton.addEventListener('pointerenter', event => {
                const bounds = starButton.getBoundingClientRect();
                const hoveredHalf = event.clientX < bounds.left + bounds.width / 2;
                setHoverRating(hoveredHalf ? i - 0.5 : i);
            });

            starButton.addEventListener('pointermove', event => {
                const bounds = starButton.getBoundingClientRect();
                const hoveredHalf = event.clientX < bounds.left + bounds.width / 2;
                setHoverRating(hoveredHalf ? i - 0.5 : i);
            });

            starButton.addEventListener('pointerleave', clearHoverRating);
        }

        starButtons.push(starButton);
        starRatingContainer.append(starButton);
    }

    starRatingContainer.prepend(ratingInput);
    renderRating(currentRating);

    return starRatingContainer;
}

const starRatingContainer = document.getElementById('comment-form-star-rating');

if (starRatingContainer) {
    starRatingContainer.append(createStarRatingComponent({
        defaultValue: 0,
        canEdit: true,
        size: 24,
    }));
}

if (commentTextarea) {
    resizeTextarea(commentTextarea);
    commentTextarea.addEventListener('input', () => resizeTextarea(commentTextarea));
}

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    minZoom: 17,
    maxZoom: 20,
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
}).addTo(map);

const buildingStyle = {
    color: '#3388ff',
    fillColor:'#3388ff',
    fillOpacity: 0.25,
    weight: 0,
};

const buildingStyleHover = {
    color: '#3388ff',
    fillColor: '#3388ff',
    fillOpacity: 0.2,
    weight: 2,
};

const commentForm = document.getElementById('comment-form');
const usernameInput = document.querySelector('.username-input');

if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameEl = document.querySelector('.username-input');
        const name = (usernameEl?.value || savedUsername || '').trim();
        const comment = commentForm.querySelector('textarea[name="comment"]').value.trim();
        const rating = parseFloat(commentForm.querySelector('input[name="rating"]').value);
        const location = commentForm.querySelector('select[name="location"]').value;

        if (!name) {
            alert('Please enter your name.');
            return;
        }
        if (!rating || rating < 0.5 || rating > 5) {
            alert('Please select a rating between 1 and 5.');
            return;
        }
        if (comment.length > 512) {
            alert('Comment cannot exceed 512 characters.');
            return;
        }

        let weather = 0;
        try {
            const weatherRes = await fetch('/api/weather');
            const weatherData = await weatherRes.json();
            weather = weatherData.temperature;
        } catch (_) {}

        try {
            const res = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, rating, comment, location, weather }),
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to submit rating.');
                return;
            }

            commentForm.querySelector('textarea[name="comment"]').value = '';
            resizeTextarea(commentForm.querySelector('textarea[name="comment"]'));

            const starRating = starRatingContainer.querySelector('.star-rating');
            if (starRating) {
                starRating.remove();
                starRatingContainer.append(createStarRatingComponent({
                    defaultValue: 0,
                    canEdit: true,
                    size: 24,
                }));
            }

            if (activeLocation) {
                openDetailView(activeLocation);
            }
        } catch (err) {
            alert('Failed to submit rating.');
        }
    });
}

const sidebar = document.querySelector('.sidebar');
let activeLocation = null;
let savedUsername = null;

async function loadSidebar() {
    try {
        const res = await fetch('/api/sidebar');
        if (!res.ok) throw new Error('Failed to load sidebar');
        sidebar.innerHTML = await res.text();
        activeLocation = null;
        if (savedUsername != null) {
            sidebar.querySelector('.username-input').value = savedUsername;
        }
        attachStudySpotClickHandlers();
        resizeTextarea(sidebar.querySelector('.username-input'));
        fetchWeather();
    } catch (err) {
        console.error(err);
    }
}

async function openDetailView(location) {
    savedUsername = document.querySelector('.username-input')?.value ?? savedUsername;
    activeLocation = location;

    try {
        const res = await fetch(`/api/comments/${encodeURIComponent(location)}`);
        if (!res.ok) throw new Error('Failed to load details');

        const html = await res.text();
        sidebar.innerHTML = html;

        const backBtn = sidebar.querySelector('.detail-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => loadSidebar());
        }
    } catch (err) {
        console.error(err);
    }
}

function attachStudySpotClickHandlers() {
    document.querySelectorAll('.study-spot-item').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const location = item.dataset.location;
            if (!location) return;
            openDetailView(location);
        });
    });
}

attachStudySpotClickHandlers();

async function fetchWeather() {
    try {
        const res = await fetch('/api/weather');
        const data = await res.json();
        const temp = data.temperature;
        document.getElementById('weather-temp').textContent = temp;
        if (temp <= 32) {
            document.getElementById('weather-icon').textContent = '❄️';
        } else if (temp >= 85) {
            document.getElementById('weather-icon').textContent = '🔥';
        }
    } catch (_) {}
}

fetchWeather();

buildings.forEach(building => {
    // Convert GeoJSON format to Leafet
    const leafletPoly = building.polygon.map(([lng, lat]) => [lat, lng]);
    const polygon = L.polygon(leafletPoly, buildingStyle).addTo(map);

    polygon.on('mouseover', () => polygon.setStyle(buildingStyleHover));
    polygon.on('mouseout',  () => polygon.setStyle(buildingStyle));

    polygon.on('click', () => {
        map.flyTo(polygon.getBounds().getCenter(), 19);
        const locationSelect = commentForm.querySelector('select[name="location"]');
        if (locationSelect) {
            locationSelect.value = building.name;
        }
        openDetailView(building.name);
    });

    polygon.bindTooltip(building.displayName, { sticky: true });
})
