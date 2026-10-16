import { Router, Request, Response } from 'express';
import { LOCATION_DATA } from '../data/locations';

const router = Router();

// GET /locations/countries
router.get('/countries', (_req: Request, res: Response) => {
  const countries = LOCATION_DATA.map((c) => ({
    code: c.code,
    name: c.name,
    phoneCode: c.phoneCode,
    currency: c.currency,
  }));
  res.json({ success: true, data: countries });
});

// GET /locations/states?countryCode=IN
router.get('/states', (req: Request, res: Response) => {
  const countryCode = (req.query.countryCode as string || 'IN').toUpperCase();
  const country = LOCATION_DATA.find((c) => c.code === countryCode || c.name.toLowerCase() === countryCode.toLowerCase());

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
router.get('/cities', (req: Request, res: Response) => {
  const countryCode = (req.query.countryCode as string || 'IN').toUpperCase();
  const stateCode = (req.query.stateCode as string || '').toUpperCase();
  const stateName = (req.query.stateName as string || '').toLowerCase();

  const country = LOCATION_DATA.find((c) => c.code === countryCode || c.name.toLowerCase() === countryCode.toLowerCase());
  if (!country) {
    res.json({ success: true, data: [] });
    return;
  }

  const state = country.states.find(
    (s) => s.code === stateCode || s.name.toLowerCase() === stateName || s.name.toUpperCase() === stateCode
  );

  if (!state) {
    res.json({ success: true, data: [] });
    return;
  }

  res.json({ success: true, data: state.cities });
});

// GET /locations/all - full hierarchy for client caching
router.get('/all', (_req: Request, res: Response) => {
  res.json({ success: true, data: LOCATION_DATA });
});

export default router;
