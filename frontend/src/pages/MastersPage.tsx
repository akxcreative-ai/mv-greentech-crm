import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Globe,
  MapPin,
  Building,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  RefreshCw,
  Edit2,
  Layers,
} from 'lucide-react';
import { locationsApi } from '../lib/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const MastersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'countries' | 'states' | 'cities' | 'currencies'>('countries');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('IN');
  const [selectedStateCode, setSelectedStateCode] = useState('MH');

  // Currency Rates State (Base: INR)
  const [currencies, setCurrencies] = useState([
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateToInr: 1.0, isBase: true, updatedAt: '2026-10-15' },
    { code: 'USD', name: 'US Dollar', symbol: '$', rateToInr: 84.25, isBase: false, updatedAt: '2026-10-15' },
    { code: 'EUR', name: 'Euro', symbol: '€', rateToInr: 91.8, isBase: false, updatedAt: '2026-10-15' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rateToInr: 11.6, isBase: false, updatedAt: '2026-10-15' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'AED', rateToInr: 22.95, isBase: false, updatedAt: '2026-10-15' },
    { code: 'GBP', name: 'British Pound', symbol: '£', rateToInr: 107.4, isBase: false, updatedAt: '2026-10-15' },
  ]);

  const [editingCurrency, setEditingCurrency] = useState<{ code: string; rateToInr: number } | null>(null);

  // Fetch countries
  const { data: countriesResponse, isLoading: loadingCountries } = useQuery({
    queryKey: ['location-countries'],
    queryFn: () => locationsApi.getCountries(),
  });
  const countries = countriesResponse?.data || [];

  // Fetch states
  const { data: statesResponse, isLoading: loadingStates } = useQuery({
    queryKey: ['location-states', selectedCountryCode],
    queryFn: () => locationsApi.getStates(selectedCountryCode),
    enabled: !!selectedCountryCode,
  });
  const states = statesResponse?.data || [];

  // Fetch cities
  const { data: citiesResponse, isLoading: loadingCities } = useQuery({
    queryKey: ['location-cities', selectedCountryCode, selectedStateCode],
    queryFn: () => locationsApi.getCities(selectedCountryCode, selectedStateCode),
    enabled: !!selectedCountryCode && !!selectedStateCode,
  });
  const cities = citiesResponse?.data || [];

  // Filter lists
  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStates = states.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCities = cities.filter((city) =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateRate = () => {
    if (!editingCurrency) return;
    setCurrencies((prev) =>
      prev.map((c) =>
        c.code === editingCurrency.code
          ? { ...c, rateToInr: Number(editingCurrency.rateToInr), updatedAt: new Date().toISOString().split('T')[0] }
          : c
      )
    );
    setEditingCurrency(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Location & Currency Masters</h1>
              <p className="text-xs text-white/60">
                Manage global countries, administrative provinces, industrial cities, and official foreign exchange rates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 max-w-xl">
        <button
          onClick={() => {
            setActiveTab('countries');
            setSearchTerm('');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'countries' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Countries ({countries.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('states');
            setSearchTerm('');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'states' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          States / Provinces
        </button>
        <button
          onClick={() => {
            setActiveTab('cities');
            setSearchTerm('');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'cities' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          Cities
        </button>
        <button
          onClick={() => {
            setActiveTab('currencies');
            setSearchTerm('');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'currencies' ? 'bg-teal-600 text-white shadow-md' : 'text-white/60 hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Currencies & Forex
        </button>
      </div>

      {/* TAB 1: COUNTRIES */}
      {activeTab === 'countries' && (
        <div className="space-y-4">
          <div className="glass-card p-4 border border-white/10 rounded-2xl flex items-center justify-between gap-4">
            <div className="w-72">
              <Input
                placeholder="Search country name or ISO code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-white/40" />}
              />
            </div>
            <div className="text-xs text-white/50">
              Total Countries Enabled: <span className="text-white font-semibold">{countries.length}</span>
            </div>
          </div>

          <div className="glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-white/60 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Country Name</th>
                  <th className="py-3 px-4">ISO Code</th>
                  <th className="py-3 px-4">Phone Prefix</th>
                  <th className="py-3 px-4">Official Currency</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredCountries.map((c) => (
                  <tr key={c.code} className="hover:bg-white/[0.03]">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                      <span className="text-base">🌐</span>
                      {c.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-teal-400 font-semibold">{c.code}</td>
                    <td className="py-3.5 px-4 font-mono text-white/70">{c.phoneCode}</td>
                    <td className="py-3.5 px-4 font-mono text-amber-300">{c.currency}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STATES */}
      {activeTab === 'states' && (
        <div className="space-y-4">
          <div className="glass-card p-4 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/60">Filter by Country:</span>
              <select
                value={selectedCountryCode}
                onChange={(e) => setSelectedCountryCode(e.target.value)}
                className="glass-input text-xs py-2 px-3 rounded-xl bg-[#0B1220] border border-white/10 text-white"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-72">
              <Input
                placeholder="Search state name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-white/40" />}
              />
            </div>
          </div>

          <div className="glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-white/60 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">State / Province Name</th>
                  <th className="py-3 px-4">State Code</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Indexed Cities</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredStates.map((s) => (
                  <tr key={s.code} className="hover:bg-white/[0.03]">
                    <td className="py-3.5 px-4 font-semibold text-white">{s.name}</td>
                    <td className="py-3.5 px-4 font-mono text-teal-400 font-semibold">{s.code}</td>
                    <td className="py-3.5 px-4">{selectedCountryCode}</td>
                    <td className="py-3.5 px-4 font-mono text-white/70">{s.cityCount} cities</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedStateCode(s.code);
                          setActiveTab('cities');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-medium"
                      >
                        Explore Cities →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CITIES */}
      {activeTab === 'cities' && (
        <div className="space-y-4">
          <div className="glass-card p-4 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/60">Country:</span>
              <select
                value={selectedCountryCode}
                onChange={(e) => setSelectedCountryCode(e.target.value)}
                className="glass-input text-xs py-2 px-3 rounded-xl bg-[#0B1220] border border-white/10 text-white"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>

              <span className="text-xs text-white/60 ml-2">State:</span>
              <select
                value={selectedStateCode}
                onChange={(e) => setSelectedStateCode(e.target.value)}
                className="glass-input text-xs py-2 px-3 rounded-xl bg-[#0B1220] border border-white/10 text-white"
              >
                {states.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-72">
              <Input
                placeholder="Search city name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-white/40" />}
              />
            </div>
          </div>

          <div className="glass-card p-6 border border-white/10 rounded-2xl shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
              <span>
                Registered Industrial Cities in {selectedStateCode}, {selectedCountryCode}
              </span>
              <span className="text-xs text-teal-400 font-mono font-normal">
                {filteredCities.length} cities available
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {filteredCities.map((cityName) => (
                <div
                  key={cityName}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-medium flex items-center justify-between hover:bg-white/10 transition"
                >
                  <span className="truncate">{cityName}</span>
                  <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 ml-1.5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CURRENCIES & FOREX */}
      {activeTab === 'currencies' && (
        <div className="space-y-4">
          <div className="glass-card p-4 border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Foreign Exchange Currency Conversion</h3>
              <p className="text-xs text-white/60">
                Base Currency is <strong>Indian Rupee (INR ₹)</strong>. Exchange rates are applied when generating multi-currency quotations.
              </p>
            </div>
            <div className="text-xs text-teal-400 font-mono">
              Auto-sync: Enabled (Daily)
            </div>
          </div>

          <div className="glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-white/60 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Currency</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Exchange Rate (in INR)</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {currencies.map((curr) => (
                  <tr key={curr.code} className="hover:bg-white/[0.03]">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {curr.name} {curr.isBase && <span className="ml-2 text-[10px] text-teal-400 font-normal">(Base Currency)</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-teal-400 font-bold">{curr.code}</td>
                    <td className="py-3.5 px-4 font-bold text-white text-sm">{curr.symbol}</td>
                    <td className="py-3.5 px-4 font-mono text-amber-300 font-semibold">
                      {curr.isBase ? '1.0000 INR' : `₹ ${curr.rateToInr.toFixed(2)} / 1 ${curr.code}`}
                    </td>
                    <td className="py-3.5 px-4 text-white/50">{curr.updatedAt}</td>
                    <td className="py-3.5 px-4 text-right">
                      {!curr.isBase && (
                        <button
                          onClick={() => setEditingCurrency({ code: curr.code, rateToInr: curr.rateToInr })}
                          className="px-2.5 py-1 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-[11px] font-medium inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit Rate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Rate Modal */}
      {editingCurrency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-card max-w-sm w-full p-6 border border-white/15">
            <h3 className="text-base font-bold text-white mb-2">Update Exchange Rate</h3>
            <p className="text-xs text-white/60 mb-4">
              Set conversion value for 1 {editingCurrency.code} in Indian Rupees (INR ₹).
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  1 {editingCurrency.code} = ? INR
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingCurrency.rateToInr}
                  onChange={(e) =>
                    setEditingCurrency({ ...editingCurrency, rateToInr: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full py-2 px-3 rounded-lg bg-white/5 border border-white/20 text-white font-mono text-sm focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setEditingCurrency(null)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleUpdateRate}>
                  Save Rate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
