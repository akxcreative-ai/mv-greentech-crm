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
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
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
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-indigo-950/40 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Sales Training & Knowledge Base
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  Confidential
                </span>
              </h1>
              <p className="text-sm text-slate-400">
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
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950/50"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Material</span>
          </Button>
        )}
      </div>

      {/* Security Notice for Sales Team */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
        <Lock className="w-4 h-4 flex-shrink-0 text-amber-400" />
        <span>
          <strong>Security Notice:</strong> All documents are strictly view-only with embedded anti-leak watermarks. Direct downloading, printing, and unauthorized sharing are prohibited and logged.
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
            className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">Loading authorized training materials...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <GlassCard className="py-16 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto border border-slate-700">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white">No Training Materials Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'No documents match your search or category filter.'
              : 'No training documents uploaded yet.'}
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((material) => {
            const isAllAccess = material.isAllAccess;
            const assignedCount = material.accessList?.length || 0;

            return (
              <GlassCard
                key={material.id}
                className="flex flex-col justify-between p-5 hover:border-emerald-500/40 transition group border-slate-800/80 bg-slate-900/60"
              >
                <div>
                  {/* Top Bar: Icon + Category + Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition">
                        {material.fileType === 'PDF' && <FileText className="w-5 h-5 text-rose-400" />}
                        {material.fileType === 'PPT' && <FileSpreadsheet className="w-5 h-5 text-amber-400" />}
                        {material.fileType === 'IMAGE' && <ImageIcon className="w-5 h-5 text-sky-400" />}
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                          {material.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {material.fileType} • {material.fileSize ? (material.fileSize / 1024).toFixed(0) + ' KB' : 'Document'}
                        </span>
                      </div>
                    </div>

                    {/* Access Badge */}
                    {isAllAccess ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        <Unlock className="w-3 h-3" />
                        <span>All Team</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        <Lock className="w-3 h-3" />
                        <span>{assignedCount} Assigned</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition line-clamp-1">
                    {material.title}
                  </h3>
                  {material.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {material.description}
                    </p>
                  )}

                  {/* Meta info */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(material.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {isDirectorOrAdmin && material._count && (
                      <span
                        onClick={() => openViewsModal(material)}
                        className="cursor-pointer text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition"
                        title="Click to view audit log"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{material._count.viewLogs} views</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 space-y-2">
                  <Button
                    onClick={() => setActiveViewerMaterial(material)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-xs font-semibold rounded-xl shadow-md transition"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Secure Material</span>
                  </Button>

                  {isDirectorOrAdmin && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openAccessModal(material)}
                        className="flex-1 py-1.5 px-2 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center gap-1 border border-slate-700"
                      >
                        <Users className="w-3 h-3 text-indigo-400" />
                        <span>Manage Access</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${material.title}"?`)) {
                            deleteMutation.mutate(material.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition border border-slate-700"
                        title="Delete Material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </GlassCard>
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
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Document Title *
            </label>
            <Input
              placeholder="e.g. Ultrasonic Level Transmitter Pitch Deck & Specs"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Category *
            </label>
            <Select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              options={CATEGORIES.filter((c) => c !== 'All').map((c) => ({ value: c, label: c }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief context or key takeaway for the sales team..."
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              File (PDF, PPT, PPTX, or Image) *
            </label>
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 cursor-pointer bg-slate-900/60 p-2 rounded-lg border border-slate-700"
            />
            {uploadFile && (
              <p className="text-[11px] text-emerald-400 mt-1">
                Selected: {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Access Control Options */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Who Can Access This Material?
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setUploadIsAllAccess(true)}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition flex items-center gap-2 ${
                  uploadIsAllAccess
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Unlock className="w-4 h-4" />
                <div>
                  <div className="font-semibold text-white">All Sales Team</div>
                  <div className="text-[10px] text-slate-400">Available to all representatives</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUploadIsAllAccess(false)}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition flex items-center gap-2 ${
                  !uploadIsAllAccess
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                <div>
                  <div className="font-semibold text-white">Selected Reps</div>
                  <div className="text-[10px] text-slate-400">Only chosen individuals</div>
                </div>
              </button>
            </div>

            {/* Individual Representative Selector */}
            {!uploadIsAllAccess && (
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Select Salespersons ({uploadSelectedUserIds.length} chosen)
                </span>
                {salesUsers.map((u) => {
                  const isChecked = uploadSelectedUserIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      onClick={() => toggleUploadUser(u.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition ${
                        isChecked ? 'bg-indigo-500/20 border border-indigo-500/30 text-white' : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                          {u.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-medium">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={uploadMutation.isPending || !uploadFile || !uploadTitle}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {uploadMutation.isPending ? 'Uploading & Encrypting...' : 'Upload Document'}
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
          <p className="text-xs text-slate-400">
            Control which team members have authorization to view this document.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEditIsAllAccess(true)}
              className={`p-2.5 rounded-xl border text-left text-xs font-medium transition flex items-center gap-2 ${
                editIsAllAccess
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Unlock className="w-4 h-4" />
              <div>
                <div className="font-semibold text-white">All Sales Team</div>
                <div className="text-[10px] text-slate-400">Everyone can access</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setEditIsAllAccess(false)}
              className={`p-2.5 rounded-xl border text-left text-xs font-medium transition flex items-center gap-2 ${
                !editIsAllAccess
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Lock className="w-4 h-4" />
              <div>
                <div className="font-semibold text-white">Specific Reps</div>
                <div className="text-[10px] text-slate-400">Restricted list</div>
              </div>
            </button>
          </div>

          {!editIsAllAccess && (
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 max-h-56 overflow-y-auto">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Assign Representatives ({editSelectedUserIds.length} chosen)
              </span>
              {salesUsers.map((u) => {
                const isChecked = editSelectedUserIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    onClick={() => toggleEditUser(u.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition ${
                      isChecked ? 'bg-indigo-500/20 border border-indigo-500/30 text-white' : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                        {u.firstName?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-medium">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setIsAccessModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => accessMutation.mutate()}
              disabled={accessMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
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
          <p className="text-xs text-slate-400">
            Audit trail of team members who have opened and studied this material.
          </p>

          {isLoadingViews ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading view logs...</div>
          ) : !viewsResponse?.data || viewsResponse.data.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs bg-slate-900/50 rounded-xl">
              No one has opened this document yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
              {viewsResponse.data.map((log: TrainingViewLog) => (
                <div key={log.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                      {log.user.firstName?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {log.user.firstName} {log.user.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.user.email} • {log.user.role}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
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
