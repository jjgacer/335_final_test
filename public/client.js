// Center of McKeldin Mall
const center = [38.986013649261004, -76.9425051267938]

// Lock the user to a 1-mile radius around McKeldin
const bounds = L.latLng(center).toBounds(1 * 1609 * 2);

const map = L.map('map', { maxBounds: bounds, maxBoundsViscosity: 1.0 }).setView(center, 18);

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

    polygon.bindTooltip(building.name, { sticky: true });
})
