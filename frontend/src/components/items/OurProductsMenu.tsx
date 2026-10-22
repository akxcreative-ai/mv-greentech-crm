import React, { useState, useEffect } from 'react';
import {
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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
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

  const currentCategoryObj =
    PRODUCT_CATEGORIES.find((c) => c.id === activeTab) || PRODUCT_CATEGORIES[0];

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
    <div className={`relative inline-block ${className}`}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs border shrink-0 cursor-pointer ${
          selectedCategory
            ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
            : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
        }`}
        title="Open Our Products menu"
      >
        <Layers className={`w-4 h-4 ${selectedCategory ? 'text-white' : 'text-emerald-700'}`} />
        <span className="truncate max-w-[200px]">
          {selectedCategory ? selectedCategory : 'Our Products'}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
          selectedCategory ? 'bg-emerald-700 text-white' : 'bg-emerald-200/70 text-emerald-800'
        }`}>
          List
        </span>
      </button>

      {/* Full Modal Overlay (Cannot be clipped by any overflow-hidden container) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Our Products Hierarchy</h3>
                  <p className="text-[11px] text-slate-500">
                    Select a sensor or product line to filter catalog instantly
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium border border-rose-200 transition-colors"
                  >
                    Reset Filter
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Search inside Menu */}
            <div className="p-3 bg-white border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Quick search e.g. Inductive, Ultrasonic, Water meter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            {searchQuery.trim() ? (
              /* Search Results */
              <div className="p-4 overflow-y-auto max-h-[460px]">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Matching Products ({filteredSearchResults.length})
                </p>
                {filteredSearchResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredSearchResults.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSubSelect(sub.name)}
                        className={`text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between group border cursor-pointer ${
                          selectedCategory === sub.name
                            ? 'bg-emerald-50 text-emerald-900 font-bold border-emerald-300 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-slate-900 group-hover:text-emerald-700">
                            {sub.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Category: {sub.parentCategory}
                          </p>
                        </div>
                        {selectedCategory === sub.name ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs text-slate-400">
                    No matching sensor or product found. Try another keyword.
                  </div>
                )}
              </div>
            ) : (
              /* Category Browser (matching mvgreentech.com hierarchy) */
              <div className="flex flex-col sm:flex-row flex-1 overflow-hidden min-h-[380px]">
                {/* Left Category List */}
                <div className="w-full sm:w-60 bg-slate-50/70 border-b sm:border-b-0 sm:border-r border-slate-200 p-2.5 space-y-1.5 overflow-y-auto">
                  <button
                    type="button"
                    onClick={handleClear}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      !selectedCategory
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      All Products
                    </span>
                    {!selectedCategory && <Check className="w-4 h-4" />}
                  </button>

                  <div className="py-1">
                    <div className="h-px bg-slate-200" />
                  </div>

                  {PRODUCT_CATEGORIES.map((cat) => {
                    const isActive = activeTab === cat.id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveTab(cat.id)}
                        onMouseEnter={() => setActiveTab(cat.id)}
                        className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                            : 'text-slate-700 hover:bg-slate-200/50'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          {getCategoryIcon(cat.id)}
                          <span>{cat.name}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {cat.subcategories.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Subcategory Grid */}
                <div className="flex-1 p-4 overflow-y-auto bg-white">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                        {getCategoryIcon(currentCategoryObj.id)}
                        {currentCategoryObj.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {currentCategoryObj.description || 'Select subcategory to filter'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMainCategorySelect(currentCategoryObj.name)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      Show All {currentCategoryObj.name}s →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentCategoryObj.subcategories.map((sub) => {
                      const isSelected = selectedCategory === sub.name;

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleSubSelect(sub.name)}
                          className={`text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between group border cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-900 font-bold border-emerald-300 shadow-xs'
                              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <span className="font-medium group-hover:text-emerald-700 group-hover:font-semibold">
                            {sub.name}
                          </span>
                          {isSelected ? (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>Click on any sensor to filter the master table</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
