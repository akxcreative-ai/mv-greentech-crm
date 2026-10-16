"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const locations_1 = require("../data/locations");
const router = (0, express_1.Router)();
// GET /locations/countries
router.get('/countries', (_req, res) => {
    const countries = locations_1.LOCATION_DATA.map((c) => ({
        code: c.code,
        name: c.name,
        phoneCode: c.phoneCode,
        currency: c.currency,
    }));
    res.json({ success: true, data: countries });
});
// GET /locations/states?countryCode=IN
router.get('/states', (req, res) => {
    const countryCode = (req.query.countryCode || 'IN').toUpperCase();
    const country = locations_1.LOCATION_DATA.find((c) => c.code === countryCode || c.name.toLowerCase() === countryCode.toLowerCase());
    if (!country) {
        res.json({ success: true, data: [] });
        return;
    }
    const states = country.states.map((s) => ({
        code: s.code,
        name: s.name,
        cityCount: s.cities.length,
    }));
    res.json({ success: true, data: states });
});
// GET /locations/cities?countryCode=IN&stateCode=MH
router.get('/cities', (req, res) => {
    const countryCode = (req.query.countryCode || 'IN').toUpperCase();
    const stateCode = (req.query.stateCode || '').toUpperCase();
    const stateName = (req.query.stateName || '').toLowerCase();
    const country = locations_1.LOCATION_DATA.find((c) => c.code === countryCode || c.name.toLowerCase() === countryCode.toLowerCase());
    if (!country) {
        res.json({ success: true, data: [] });
        return;
    }
    const state = country.states.find((s) => s.code === stateCode || s.name.toLowerCase() === stateName || s.name.toUpperCase() === stateCode);
    if (!state) {
        res.json({ success: true, data: [] });
        return;
    }
    res.json({ success: true, data: state.cities });
});
// GET /locations/all - full hierarchy for client caching
router.get('/all', (_req, res) => {
    res.json({ success: true, data: locations_1.LOCATION_DATA });
});
exports.default = router;
