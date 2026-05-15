const express = require('express');
const router = express.Router();
const Rating = require('./data/schema');
const buildings = require('./data/buildings.json');

// Helper function (imported from main.js if needed)
const { updateBuildingRatings, getWeather } = require('./helpers');

router.get('/weather', async (req, res) => {
    const temperature = await getWeather();
    res.json({ temperature });
});

router.get('/sidebar', (req, res) => {
    res.render('components/sidebar-content', { buildings }, (err, html) => {
        if (err) {
            return res.status(500).json({ error: 'Render error' });
        }
        res.send(html);
    });
});

router.get('/comments/:location', async (req, res) => {
    try {
        const location = req.params.location;
        const building = buildings.find(b => b.name === location);
        if (!building) {
            return res.status(404).json({ error: 'Building not found' });
        }
        const comments = await Rating.find({ location }).sort({ createdAt: -1 });
        res.render('components/detail-view', { building, comments }, (err, html) => {
            if (err) {
                return res.status(500).json({ error: 'Render error' });
            }
            res.send(html);
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/ratings', async (req, res) => {
    try {
        const rating = new Rating(req.body);
        await rating.save();
        await updateBuildingRatings();
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

module.exports = router;
