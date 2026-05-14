// Center of McKeldin Mall
const center = [38.986013649261004, -76.9425051267938]

// Lock the user to a 1-mile radius around McKeldin
const bounds = L.latLng(center).toBounds(1 * 1609 * 2);

const map = L.map('map', { maxBounds: bounds, maxBoundsViscosity: 1.0 }).setView(center, 18);
const commentTextarea = document.querySelector('.comment-form > textarea');
const allStudySpotsContainer = document.getElementById('all-study-spots');

function resizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}

function formatStudySpotRating(rating) {
    return Number(rating).toPrecision(2);
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

function populateAllStudySpots() {
    if (!allStudySpotsContainer) return;

    allStudySpotsContainer.innerHTML = '';

    buildings.forEach(building => {
        const studySpot = document.createElement('div');
        studySpot.className = 'study-spot-item';

        const studySpotImage = document.createElement('img');
        studySpotImage.src = building.image;
        studySpotImage.alt = building.displayName;
        studySpotImage.width = 64;
        studySpotImage.height = 64;

        const studySpotName = document.createElement('div');
        studySpotName.className = 'study-spot-name';
        studySpotName.textContent = building.displayName;

        const studySpotStars = createStarRatingComponent({
            defaultValue: building.rating,
            canEdit: false,
            size: 16,
        });

        const studySpotRating = document.createElement('span');
        studySpotRating.className = 'study-spot-rating';
        studySpotRating.textContent = `(${formatStudySpotRating(building.rating)})`;

        const studySpotRatingRow = document.createElement('div');
        studySpotRatingRow.className = 'study-spot-rating-row';
        studySpotRatingRow.append(studySpotStars, studySpotRating);

        const studySpotText = document.createElement('div');
        studySpotText.className = 'study-spot-content';

        studySpotText.append(studySpotName, studySpotRatingRow);
        studySpot.append(studySpotImage, studySpotText);
        allStudySpotsContainer.append(studySpot);
    });
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

buildings.forEach(building => {
    // Convert GeoJSON format to Leafet
    const leafletPoly = building.polygon.map(([lng, lat]) => [lat, lng]);
    const polygon = L.polygon(leafletPoly, buildingStyle).addTo(map);

    polygon.on('mouseover', () => polygon.setStyle(buildingStyleHover));
    polygon.on('mouseout',  () => polygon.setStyle(buildingStyle));

    polygon.bindTooltip(building.displayName, { sticky: true });
})

populateAllStudySpots();
