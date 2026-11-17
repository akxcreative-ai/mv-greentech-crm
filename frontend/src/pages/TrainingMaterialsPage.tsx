import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Lock,
  Unlock,
  Users,
  Eye,
  Trash2,
  Calendar,
  Search,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { trainingApi, usersApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { TrainingMaterial, TrainingViewLog, User } from '../lib/types';
import { SecureDocumentViewer } from '../components/training/SecureDocumentViewer';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

const CATEGORIES = [
  'All',
  'Product Specs & Manuals',
  'Sales Pitches & Scripts',
  'Pricing & Rate Cards',
  'Objection Handling',
  'Competitor Analysis',
  'Company Policy & Guidelines',
  'General',
];

export const TrainingMaterialsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isDirectorOrAdmin =
    currentUser?.role === 'DIRECTOR' ||
    currentUser?.role === 'ADMINISTRATOR' ||
    currentUser?.role === 'SALES_HEAD';

  // State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeViewerMaterial, setActiveViewerMaterial] = useState<TrainingMaterial | null>(null);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isViewsModalOpen, setIsViewsModalOpen] = useState(false);
  const [materialForAccess, setMaterialForAccess] = useState<TrainingMaterial | null>(null);
  const [materialForViews, setMaterialForViews] = useState<TrainingMaterial | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Product Specs & Manuals');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadIsAllAccess, setUploadIsAllAccess] = useState(true);
  const [uploadSelectedUserIds, setUploadSelectedUserIds] = useState<string[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Access Edit Form State
  const [editIsAllAccess, setEditIsAllAccess] = useState(true);
  const [editSelectedUserIds, setEditSelectedUserIds] = useState<string[]>([]);

  // Fetch materials
  const { data: materialsResponse, isLoading } = useQuery({
    queryKey: ['training-materials'],
    queryFn: () => trainingApi.list(),
  });

  // Fetch users for access selection (Directors only)
  const { data: usersResponse } = useQuery({
    queryKey: ['users-for-training-access'],
    queryFn: () => usersApi.list({ limit: 100 }),
    enabled: isDirectorOrAdmin,
  });

  const materials = materialsResponse?.data || [];
  const salesUsers: User[] = (usersResponse?.data || []).filter(
    (u: User) => u.role === 'SALESPERSON' || u.role === 'SALES_HEAD'
  );

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error('Please select a file');
      if (!uploadTitle.trim()) throw new Error('Title is required');

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle.trim());
      formData.append('category', uploadCategory);
      formData.append('description', uploadDescription.trim());
      formData.append('isAllAccess', String(uploadIsAllAccess));
      if (!uploadIsAllAccess) {
        formData.append('allowedUserIds', JSON.stringify(uploadSelectedUserIds));
      }

      return trainingApi.upload(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-materials'] });
      setIsUploadModalOpen(false);
      resetUploadForm();
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.error || err.message || 'Upload failed');
    },
  });

  // Access Update Mutation
  const accessMutation = useMutation({
    mutationFn: async () => {
      if (!materialForAccess) return;
      return trainingApi.updateAccess(materialForAccess.id, {
        isAllAccess: editIsAllAccess,
        allowedUserIds: editSelectedUserIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-materials'] });
      setIsAccessModalOpen(false);
      setMaterialForAccess(null);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => trainingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-materials'] });
    },
  });

  // Fetch Views for audit modal
  const { data: viewsResponse, isLoading: isLoadingViews } = useQuery({
    queryKey: ['training-views', materialForViews?.id],
    queryFn: () => (materialForViews ? trainingApi.getViews(materialForViews.id) : null),
    enabled: !!materialForViews && isViewsModalOpen,
  });

  const resetUploadForm = () => {
    setUploadTitle('');
    setUploadCategory('Product Specs & Manuals');
    setUploadDescription('');
    setUploadIsAllAccess(true);
    setUploadSelectedUserIds([]);
    setUploadFile(null);
    setUploadError(null);
  };

  const openAccessModal = (m: TrainingMaterial) => {
    setMaterialForAccess(m);
    setEditIsAllAccess(m.isAllAccess);
    setEditSelectedUserIds(m.accessList ? m.accessList.map((a) => a.userId) : []);
    setIsAccessModalOpen(true);
  };

  const openViewsModal = (m: TrainingMaterial) => {
    setMaterialForViews(m);
    setIsViewsModalOpen(true);
  };

  const toggleUploadUser = (uid: string) => {
    setUploadSelectedUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const toggleEditUser = (uid: string) => {
    setEditSelectedUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  // Filter materials
  const filteredMaterials = materials.filter((m) => {
    const matchesCategory =
      selectedCategory === 'All' || m.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner - High Contrast Clean Styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Sales Training & Knowledge Base
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
                  Confidential
                </span>
              </div>
              <p className="text-sm text-slate-600 font-normal mt-0.5">
                Official product catalogs, sales scripts, objection handling, and protected training guides.
              </p>
            </div>
          </div>
        </div>

        {isDirectorOrAdmin && (
          <Button
            onClick={() => {
              resetUploadForm();
              setIsUploadModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Material</span>
          </Button>
        )}
      </div>

      {/* Security Notice for Sales Team - High Visibility */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 shadow-xs">
        <ShieldCheck className="w-5 h-5 flex-shrink-0 text-amber-700" />
        <span className="leading-relaxed">
          <strong className="text-amber-950 font-bold">Security Notice:</strong> All training documents are strictly view-only with embedded anti-leak dynamic watermarks. Direct downloading, printing, and unauthorized sharing are strictly prohibited and audited.
        </span>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents or scripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-700'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-xs'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Materials Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500 space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading authorized training materials...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Training Materials Found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'No documents match your search or selected category filter.'
              : 'No training documents uploaded yet. Click "Upload New Material" above to add the first guide.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((material) => {
            const isAllAccess = material.isAllAccess;
            const assignedCount = material.accessList?.length || 0;

            return (
              <div
                key={material.id}
                className="flex flex-col justify-between p-5 bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 rounded-2xl group"
              >
                <div>
                  {/* Top Bar: Icon + Category + Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-slate-100 text-emerald-700 border border-slate-200 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition">
                        {material.fileType === 'PDF' && <FileText className="w-6 h-6 text-rose-600" />}
                        {material.fileType === 'PPT' && <FileSpreadsheet className="w-6 h-6 text-amber-600" />}
                        {material.fileType === 'IMAGE' && <ImageIcon className="w-6 h-6 text-sky-600" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                          {material.category}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {material.fileType} • {material.fileSize ? (material.fileSize / 1024).toFixed(0) + ' KB' : 'Document'}
                        </span>
                      </div>
                    </div>

                    {/* Access Badge */}
                    {isAllAccess ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        <span>All Team</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                        <Lock className="w-3 h-3 text-indigo-600" />
                        <span>{assignedCount} Reps</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition line-clamp-1 mt-1">
                    {material.title}
                  </h3>
                  {material.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {material.description}
                    </p>
                  )}

                  {/* Meta info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(material.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {isDirectorOrAdmin && material._count && (
                      <button
                        type="button"
                        onClick={() => openViewsModal(material)}
                        className="cursor-pointer text-slate-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition"
                        title="Click to view audit log"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{material._count.viewLogs} views</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 space-y-2">
                  <Button
                    onClick={() => setActiveViewerMaterial(material)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Secure Material</span>
                  </Button>

                  {isDirectorOrAdmin && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openAccessModal(material)}
                        className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Manage Access</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${material.title}"?`)) {
                            deleteMutation.mutate(material.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition border border-rose-200 cursor-pointer"
                        title="Delete Material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULLSCREEN SECURE DOCUMENT VIEWER MODAL */}
      {activeViewerMaterial && (
        <SecureDocumentViewer
          material={activeViewerMaterial}
          onClose={() => setActiveViewerMaterial(null)}
        />
      )}

      {/* UPLOAD MODAL (Director/Admin only) */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Training Material"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{uploadError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document Title *
            </label>
            <Input
              placeholder="e.g. Ultrasonic Level Transmitter Pitch Deck & Specs"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category *
            </label>
            <Select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              options={CATEGORIES.filter((c) => c !== 'All').map((c) => ({ value: c, label: c }))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief context or key takeaway for the sales team..."
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              File (PDF, PPT, PPTX, or Image) *
            </label>
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-300"
            />
            {uploadFile && (
              <p className="text-xs font-semibold text-emerald-800 mt-1">
                Selected: {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Access Control Options */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Who Can Access This Material?
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setUploadIsAllAccess(true)}
                className={`p-3 rounded-xl border text-left text-xs font-medium transition flex items-center gap-2.5 cursor-pointer ${
                  uploadIsAllAccess
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Unlock className="w-5 h-5 text-emerald-700" />
                <div>
                  <div className="font-bold text-slate-900">All Sales Team</div>
                  <div className="text-[10px] text-slate-500">Everyone can view</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUploadIsAllAccess(false)}
                className={`p-3 rounded-xl border text-left text-xs font-medium transition flex items-center gap-2.5 cursor-pointer ${
                  !uploadIsAllAccess
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Lock className="w-5 h-5 text-indigo-700" />
                <div>
                  <div className="font-bold text-slate-900">Selected Reps</div>
                  <div className="text-[10px] text-slate-500">Only chosen individuals</div>
                </div>
              </button>
            </div>

            {/* Individual Representative Selector */}
            {!uploadIsAllAccess && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 max-h-48 overflow-y-auto">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Select Salespersons ({uploadSelectedUserIds.length} chosen)
                </span>
                {salesUsers.map((u) => {
                  const isChecked = uploadSelectedUserIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      onClick={() => toggleUploadUser(u.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition ${
                        isChecked
                          ? 'bg-indigo-100/70 border border-indigo-300 text-slate-900 font-semibold'
                          : 'hover:bg-slate-200/50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                          {u.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[10px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-0 w-4 h-4"
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={uploadMutation.isPending || !uploadFile || !uploadTitle}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MANAGE ACCESS MODAL */}
      <Modal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        title={`Manage Access: ${materialForAccess?.title || ''}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 font-medium">
            Control which team members have authorization to view this document.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEditIsAllAccess(true)}
              className={`p-3 rounded-xl border text-left text-xs font-medium transition flex items-center gap-2.5 cursor-pointer ${
                editIsAllAccess
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Unlock className="w-5 h-5 text-emerald-700" />
              <div>
                <div className="font-bold text-slate-900">All Sales Team</div>
                <div className="text-[10px] text-slate-500">Everyone can access</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setEditIsAllAccess(false)}
              className={`p-3 rounded-xl border text-left text-xs font-medium transition flex items-center gap-2.5 cursor-pointer ${
                !editIsAllAccess
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Lock className="w-5 h-5 text-indigo-700" />
              <div>
                <div className="font-bold text-slate-900">Specific Reps</div>
                <div className="text-[10px] text-slate-500">Restricted list</div>
              </div>
            </button>
          </div>

          {!editIsAllAccess && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 max-h-56 overflow-y-auto">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Assign Representatives ({editSelectedUserIds.length} chosen)
              </span>
              {salesUsers.map((u) => {
                const isChecked = editSelectedUserIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    onClick={() => toggleEditUser(u.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition ${
                      isChecked
                        ? 'bg-indigo-100/70 border border-indigo-300 text-slate-900 font-semibold'
                        : 'hover:bg-slate-200/50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                        {u.firstName?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-[10px] text-slate-500">{u.email}</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-0 w-4 h-4"
                    />
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setIsAccessModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => accessMutation.mutate()}
              disabled={accessMutation.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
            >
              {accessMutation.isPending ? 'Saving...' : 'Save Permissions'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* VIEW AUDIT LOGS MODAL */}
      <Modal
        isOpen={isViewsModalOpen}
        onClose={() => setIsViewsModalOpen(false)}
        title={`View History: ${materialForViews?.title || ''}`}
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-slate-600 font-medium">
            Audit trail of team members who have opened and studied this material.
          </p>

          {isLoadingViews ? (
            <div className="py-8 text-center text-slate-500 text-xs">Loading view logs...</div>
          ) : !viewsResponse?.data || viewsResponse.data.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
              No one has opened this document yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {viewsResponse.data.map((log: TrainingViewLog) => (
                <div key={log.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {log.user.firstName?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        {log.user.firstName} {log.user.lastName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {log.user.email} • {log.user.role}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-600 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(log.viewedAt).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={() => setIsViewsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
