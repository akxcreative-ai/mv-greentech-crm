import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Layers,
  Radio,
  Wifi,
  Droplets,
  Check,
  Sparkles,
} from 'lucide-react';
import { PRODUCT_CATEGORIES, type ProductCategory, type ProductSubCategory } from '../../lib/productCategories';

interface OurProductsMenuProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null, subcategory?: string | null) => void;
  className?: string;
}

export const OurProductsMenu: React.FC<OurProductsMenuProps> = ({
  selectedCategory,
  onSelectCategory,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('sensor');
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Category icons mapping
  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'sensor':
        return <Radio className="w-4 h-4 text-emerald-600" />;
      case 'iot-solutions':
        return <Wifi className="w-4 h-4 text-emerald-600" />;
      case 'water-meter':
        return <Droplets className="w-4 h-4 text-emerald-600" />;
      default:
        return <Layers className="w-4 h-4 text-emerald-600" />;
    }
  };

  const currentCategoryObj = PRODUCT_CATEGORIES.find((c) => c.id === activeTab) || PRODUCT_CATEGORIES[0];

  // Search filtered subcategories across all categories
  const allSubcategories = PRODUCT_CATEGORIES.flatMap((c) =>
    c.subcategories.map((sub) => ({ ...sub, parentCategory: c.name }))
  );

  const filteredSearchResults = searchQuery.trim()
    ? allSubcategories.filter(
        (sub) =>
          sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.searchKeywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
          sub.parentCategory.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSubSelect = (subName: string) => {
    onSelectCategory(subName);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleMainCategorySelect = (catName: string) => {
    onSelectCategory(catName);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onSelectCategory(null);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs border ${
          selectedCategory
            ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/20'
            : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-500 hover:text-emerald-700'
        }`}
        title="Browse MV Greentech Products hierarchy"
      >
        <Layers className={`w-4 h-4 ${selectedCategory ? 'text-white' : 'text-emerald-600'}`} />
        <span className="truncate max-w-[150px]">
          {selectedCategory ? selectedCategory : 'Our Products'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${selectedCategory ? 'text-white' : 'text-slate-400'}`}
        />
      </button>

      {/* Mega Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 w-[92vw] max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header Bar with Search & Clear */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Quick search any sensor or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {selectedCategory && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 hover:underline shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Body */}
          {searchQuery.trim() ? (
            /* Search Results View */
            <div className="p-3 max-h-[380px] overflow-y-auto">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Matching Products ({filteredSearchResults.length})
              </p>
              {filteredSearchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {filteredSearchResults.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSubSelect(sub.name)}
                      className={`text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between group ${
                        selectedCategory === sub.name
                          ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium truncate group-hover:text-emerald-700">
                          {sub.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          in {sub.parentCategory}
                        </p>
                      </div>
                      {selectedCategory === sub.name && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No matching sensor or product found.
                </div>
              )}
            </div>
          ) : (
            /* Category Browser (Hierarchy matching mvgreentech.com) */
            <div className="flex flex-col sm:flex-row max-h-[420px]">
              {/* Left Column: Main Categories */}
              <div className="w-full sm:w-56 bg-slate-50/80 border-b sm:border-b-0 sm:border-r border-slate-200 p-2 space-y-1">
                <button
                  type="button"
                  onClick={handleClear}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    !selectedCategory
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    All Products
                  </span>
                  {!selectedCategory && <Check className="w-3.5 h-3.5" />}
                </button>

                <div className="pt-1 pb-1">
                  <div className="h-px bg-slate-200" />
                </div>

                {PRODUCT_CATEGORIES.map((cat) => {
                  const isActiveTab = activeTab === cat.id;
                  const isFiltered = selectedCategory === cat.name;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onMouseEnter={() => setActiveTab(cat.id)}
                      onClick={() => setActiveTab(cat.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                        isActiveTab
                          ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                          : 'text-slate-700 hover:bg-slate-200/50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {getCategoryIcon(cat.id)}
                        <span>{cat.name}</span>
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          isActiveTab ? 'translate-x-0.5 text-emerald-600 font-bold' : ''
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Subcategories List */}
              <div className="flex-1 p-3.5 overflow-y-auto bg-white">
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      {getCategoryIcon(currentCategoryObj.id)}
                      {currentCategoryObj.name}
                    </h4>
                    {currentCategoryObj.description && (
                      <p className="text-[11px] text-slate-400">
                        {currentCategoryObj.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMainCategorySelect(currentCategoryObj.name)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    View All {currentCategoryObj.name}s →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {currentCategoryObj.subcategories.map((sub) => {
                    const isSelected = selectedCategory === sub.name;

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSubSelect(sub.name)}
                        className={`text-left p-2 rounded-lg text-xs transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-300 shadow-xs'
                            : 'hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200'
                        }`}
                      >
                        <span className="truncate pr-1 group-hover:text-emerald-700">
                          {sub.name}
                        </span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="bg-slate-50 px-3.5 py-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Click any sensor to filter the table instantly</span>
            <span className="text-[10px] text-slate-400">MV GREENTECH Catalog</span>
          </div>
        </div>
      )}
    </div>
  );
};
