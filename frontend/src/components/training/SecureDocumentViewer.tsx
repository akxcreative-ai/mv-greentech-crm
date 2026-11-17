import React, { useEffect, useState, useRef, useId } from 'react';
import { X, ShieldAlert, AlertTriangle, Eye, Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { trainingApi } from '../../lib/api';
import type { TrainingMaterial } from '../../lib/types';

interface SecureDocumentViewerProps {
  material: TrainingMaterial;
  onClose: () => void;
}

export const SecureDocumentViewer: React.FC<SecureDocumentViewerProps> = ({ material, onClose }) => {
  const { user } = useAuth();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const patternId = useId();

  // Load document blob securely
  useEffect(() => {
    let active = true;
    let url: string | null = null;

    async function loadDocument() {
      try {
        setLoading(true);
        setError(null);
        const blob = await trainingApi.fetchStreamBlob(material.id);
        if (!active) return;

        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err: any) {
        if (!active) return;
        setError(err.message || 'Failed to securely load document.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDocument();

    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [material.id]);

  // Security listeners: Block shortcuts (Print, Save, Copy, Screenshot attempts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+P / Cmd+P (Print)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('Printing is strictly prohibited for confidential training materials.');
        return false;
      }

      // Block Ctrl+S / Cmd+S (Save)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('Downloading or saving this material is restricted.');
        return false;
      }

      // Block Ctrl+Shift+I or F12 (Inspect)
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i'))) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('Developer tools are disabled in secure viewer.');
        return false;
      }

      // Block PrintScreen / Snapshot key
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerSecurityAlert('Screenshots are strictly monitored and logged for security compliance.');
        // Clear clipboard
        try {
          navigator.clipboard?.writeText('');
        } catch {
          // ignore
        }
        return false;
      }

      // Escape key closes viewer
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const triggerSecurityAlert = (msg: string) => {
      setSecurityWarning(msg);
      setTimeout(() => setSecurityWarning(null), 4000);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose]);

  const nowString = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const watermarkText = `MV GREENTECH • ${user?.firstName || ''} ${user?.lastName || ''} (${user?.email || 'Confidential'}) • ${nowString} • STRICTLY CONFIDENTIAL`;

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => {
        e.preventDefault();
        setSecurityWarning('Right-click context menu is disabled for confidential material.');
        setTimeout(() => setSecurityWarning(null), 3000);
      }}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-slate-100 backdrop-blur-md select-none"
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide truncate max-w-md">
                {material.title}
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {material.fileType} • VIEW ONLY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Category: {material.category} • Authorized Viewer: <span className="text-slate-200 font-medium">{user?.firstName} {user?.lastName}</span>
            </p>
          </div>
        </div>

        {/* Action / Zoom Controls & Close */}
        <div className="flex items-center gap-2">
          {material.fileType === 'IMAGE' && (
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(50, z - 25))}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs px-2 text-slate-300 font-mono">{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(250, z + 25))}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition ml-1"
                title="Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Watermarked & Protected</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white transition flex items-center gap-1 border border-slate-700"
            title="Close Viewer (Esc)"
          >
            <X className="w-5 h-5" />
            <span className="text-xs font-medium pr-1 hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Security Warning Banner if triggered */}
      {securityWarning && (
        <div className="bg-rose-600 text-white text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-lg animate-pulse font-medium z-30">
          <AlertTriangle className="w-4 h-4" />
          <span>{securityWarning}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-auto flex items-center justify-center bg-slate-900/50 p-2 sm:p-4">
        {loading && (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm">Decrypting and loading authorized document...</p>
          </div>
        )}

        {error && (
          <div className="max-w-md p-6 bg-slate-900 border border-rose-500/30 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Access Error</h3>
            <p className="text-sm text-slate-400">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition"
            >
              Back to Materials
            </button>
          </div>
        )}

        {!loading && !error && blobUrl && (
          <div className="relative w-full h-full flex items-center justify-center overflow-auto">
            {/* 1. PDF Viewer */}
            {material.fileType === 'PDF' && (
              <div className="relative w-full h-full max-w-5xl rounded-lg overflow-hidden shadow-2xl bg-slate-800 border border-slate-700">
                <iframe
                  src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  title={material.title}
                  className="w-full h-full border-0 select-none"
                  style={{ pointerEvents: 'auto' }}
                />
              </div>
            )}

            {/* 2. Image Viewer */}
            {material.fileType === 'IMAGE' && (
              <div
                className="relative max-w-full max-h-full flex items-center justify-center p-4 transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={blobUrl}
                  alt={material.title}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="max-h-[82vh] max-w-full object-contain rounded-lg shadow-2xl pointer-events-none select-none border border-slate-700"
                />
              </div>
            )}

            {/* 3. PPT / PPTX or other Presentation */}
            {material.fileType === 'PPT' && (
              <div className="max-w-2xl p-8 bg-slate-900 border border-amber-500/30 rounded-2xl text-center space-y-4 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Protected Presentation ({material.fileName})</h3>
                  <p className="text-sm text-slate-300 mt-2">
                    PowerPoint presentations are secured in view-only mode. For high-fidelity slide viewing with interactive animations, Director can also convert slides to PDF for full inline rendering.
                  </p>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-lg text-xs text-slate-400 text-left font-mono space-y-1">
                  <div>• File: {material.fileName}</div>
                  <div>• Size: {material.fileSize ? (material.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A'}</div>
                  <div>• Protection: Direct Download Blocked</div>
                </div>
              </div>
            )}

            {/* 4. DYNAMIC SECURITY WATERMARK OVERLAY (Covers entire screen with diagonal repeating watermark) */}
            <div
              className="pointer-events-none absolute inset-0 z-20 overflow-hidden flex items-center justify-center"
              style={{ mixBlendMode: 'difference' }}
            >
              <svg className="w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern
                    id={patternId}
                    width="420"
                    height="200"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-25)"
                  >
                    <text
                      x="20"
                      y="40"
                      fill="#ef4444"
                      fontSize="13"
                      fontWeight="700"
                      fontFamily="system-ui, sans-serif"
                      letterSpacing="0.05em"
                    >
                      {watermarkText}
                    </text>
                    <text
                      x="60"
                      y="130"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="600"
                      fontFamily="system-ui, sans-serif"
                      letterSpacing="0.05em"
                    >
                      DO NOT SHARE OR SCREENSHOT • {user?.email}
                    </text>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#${patternId})`} />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Notice */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>MV GREENTECH PVT LTD • Intellectual Property & Internal Sales Material</span>
        <span className="text-amber-500/80 font-medium">Screenshots & downloads are restricted and tracked under company policy.</span>
      </div>
    </div>
  );
};
