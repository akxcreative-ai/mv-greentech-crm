import React, { useState, useEffect } from 'react';
import { Globe, MapPin, Building, Edit3 } from 'lucide-react';
import { locationsApi } from '../../lib/api';

interface LocationSelectorProps {
  countryValue?: string;
  stateValue?: string;
  cityValue?: string;
  postalCodeValue?: string;
  onCountryChange: (country: string) => void;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  onPostalCodeChange?: (postalCode: string) => void;
  error?: string;
  required?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  countryValue = 'India',
  stateValue = '',
  cityValue = '',
  postalCodeValue = '',
  onCountryChange,
  onStateChange,
  onCityChange,
  onPostalCodeChange,
  required = false,
}) => {
  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([]);
  const [states, setStates] = useState<Array<{ code: string; name: string }>>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [manualMode, setManualMode] = useState<boolean>(false);

  // Load countries on mount
  useEffect(() => {
    locationsApi.getCountries().then((res) => {
      if (res.data) setCountries(res.data);
    }).catch(() => {
      // Fallback
      setCountries([
        { code: 'IN', name: 'India' },
        { code: 'US', name: 'United States' },
        { code: 'DE', name: 'Germany' },
        { code: 'CN', name: 'China' },
        { code: 'AE', name: 'United Arab Emirates' },
      ]);
    });
  }, []);

  // Update states whenever country changes
  useEffect(() => {
    if (!countryValue) {
      setStates([]);
      setCities([]);
      return;
    }

    const matchedCountry = countries.find(
      (c) => c.name.toLowerCase() === countryValue.toLowerCase() || c.code.toLowerCase() === countryValue.toLowerCase()
    );
    const code = matchedCountry?.code || 'IN';

    locationsApi.getStates(code).then((res) => {
      if (res.data) {
        setStates(res.data);
      }
    }).catch(() => setStates([]));
  }, [countryValue, countries]);

  // Update cities whenever state changes
  useEffect(() => {
    if (!countryValue || !stateValue) {
      setCities([]);
      return;
    }

    const matchedCountry = countries.find(
      (c) => c.name.toLowerCase() === countryValue.toLowerCase() || c.code.toLowerCase() === countryValue.toLowerCase()
    );
    const countryCode = matchedCountry?.code || 'IN';

    const matchedState = states.find(
      (s) => s.name.toLowerCase() === stateValue.toLowerCase() || s.code.toLowerCase() === stateValue.toLowerCase()
    );
    const stateCode = matchedState?.code || stateValue;

    locationsApi.getCities(countryCode, stateCode).then((res) => {
      if (res.data && res.data.length > 0) {
        setCities(res.data);
      } else {
        setCities([]);
      }
    }).catch(() => setCities([]));
  }, [countryValue, stateValue, countries, states]);

  return (
    <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-teal-400 flex items-center gap-1.5 uppercase tracking-wider">
          <Globe className="w-3.5 h-3.5" />
          Location & Address Details
        </span>
        <button
          type="button"
          onClick={() => setManualMode(!manualMode)}
          className="text-xs text-white/50 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition"
          title="Toggle between dropdown selection and direct manual text typing"
        >
          <Edit3 className="w-3 h-3" />
          {manualMode ? 'Switch to Dropdowns' : 'Manual Entry'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Country */}
        <div>
          <label className="block text-xs font-medium text-white/80 mb-1">
            Country {required && <span className="text-rose-400">*</span>}
          </label>
          {manualMode ? (
            <input
              type="text"
              value={countryValue}
              onChange={(e) => onCountryChange(e.target.value)}
              placeholder="e.g. India"
              className="glass-input text-xs"
            />
          ) : (
            <select
              value={countryValue}
              onChange={(e) => {
                onCountryChange(e.target.value);
                onStateChange('');
                onCityChange('');
              }}
              className="glass-input text-xs bg-navy-900"
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name} className="bg-navy-900 text-white">
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* State / Province */}
        <div>
          <label className="block text-xs font-medium text-white/80 mb-1">
            State / Province
          </label>
          {manualMode || states.length === 0 ? (
            <input
              type="text"
              value={stateValue}
              onChange={(e) => onStateChange(e.target.value)}
              placeholder="e.g. Maharashtra"
              className="glass-input text-xs"
            />
          ) : (
            <select
              value={stateValue}
              onChange={(e) => {
                onStateChange(e.target.value);
                onCityChange('');
              }}
              className="glass-input text-xs bg-navy-900"
            >
              <option value="">Select State / UT</option>
              {states.map((s) => (
                <option key={s.code} value={s.name} className="bg-navy-900 text-white">
                  {s.name}
                </option>
              ))}
              <option value="Other" className="bg-navy-900 text-teal-300">+ Other (Custom)</option>
            </select>
          )}
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-medium text-white/80 mb-1">
            City {required && <span className="text-rose-400">*</span>}
          </label>
          {manualMode || cities.length === 0 || stateValue === 'Other' ? (
            <input
              type="text"
              value={cityValue}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="e.g. Pune"
              className="glass-input text-xs"
            />
          ) : (
            <select
              value={cityValue}
              onChange={(e) => onCityChange(e.target.value)}
              className="glass-input text-xs bg-navy-900"
            >
              <option value="">Select City</option>
              {cities.map((city) => (
                <option key={city} value={city} className="bg-navy-900 text-white">
                  {city}
                </option>
              ))}
              <option value="Other" className="bg-navy-900 text-teal-300">+ Other (Custom)</option>
            </select>
          )}
        </div>
      </div>

      {/* Postal Code & Notes */}
      {onPostalCodeChange && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">
              Postal / PIN Code
            </label>
            <input
              type="text"
              value={postalCodeValue}
              onChange={(e) => onPostalCodeChange(e.target.value)}
              placeholder="e.g. 411001"
              className="glass-input text-xs"
            />
          </div>
          <div className="md:col-span-2 flex items-center text-xs text-white/40 pt-5">
            <MapPin className="w-3.5 h-3.5 mr-1 text-teal-400 shrink-0" />
            Location data automatically standardizes reports and state-wise sales analytics.
          </div>
        </div>
      )}
    </div>
  );
};
