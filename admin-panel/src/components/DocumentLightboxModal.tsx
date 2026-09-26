import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, CheckCircle, AlertCircle, RefreshCw, FileText } from 'lucide-react';

interface DocumentLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentUrl: string;
  currentStatus?: string;
  rejectionReason?: string | null;
  onAccept: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

export const DocumentLightboxModal: React.FC<DocumentLightboxModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  documentUrl,
  currentStatus = 'pending',
  rejectionReason,
  onAccept,
  onReject,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [showRejectReasonInput, setShowRejectReasonInput] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const presetReasons = [
    'Image is blurry or unreadable',
    'Document corners are cropped / missing',
    'Incorrect document type uploaded',
    'Name or details do not match profile',
    'Document photo is dark or shadowed',
  ];

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const isPdf = documentUrl.toLowerCase().includes('.pdf');

  const handleConfirmReject = async () => {
    const finalReason = customReason.trim() || selectedReason;
    if (!finalReason) {
      alert('Please select or enter a rejection reason.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onReject(finalReason);
      setShowRejectReasonInput(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAccept = async () => {
    setIsSubmitting(true);
    try {
      await onAccept();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-between p-4 overflow-hidden animate-fadeIn">
      {/* Header Bar */}
      <div className="w-full max-w-6xl flex items-center justify-between bg-slate-900/90 border border-slate-800 px-5 py-3 rounded-2xl shadow-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">{documentTitle}</h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Status:{' '}
              <span
                className={`font-bold capitalize ${
                  currentStatus === 'verified'
                    ? 'text-emerald-400'
                    : currentStatus === 'reupload_required' || currentStatus === 'rejected'
                    ? 'text-amber-400'
                    : 'text-sky-400'
                }`}
              >
                {currentStatus.replace('_', ' ')}
              </span>
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {!isPdf && (
            <div className="flex items-center bg-slate-800/80 border border-slate-700/60 rounded-xl p-1 gap-1">
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                title="Reset View"
                className="px-2 py-1 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-slate-700 mx-1" />
              <button
                onClick={handleRotate}
                title="Rotate 90°"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}

          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-all"
            title="Download Document"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            className="p-2 bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 rounded-xl transition-all"
            title="Close Lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="w-full max-w-6xl flex-1 my-3 relative overflow-hidden bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-center p-4">
        {isPdf ? (
          <iframe src={documentUrl} className="w-full h-full rounded-xl border-0" title={documentTitle} />
        ) : (
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            <img
              src={documentUrl}
              alt={documentTitle}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl cursor-grab active:cursor-grabbing"
            />
          </div>
        )}
      </div>

      {/* Rejection Reason Form overlay if opened */}
      {showRejectReasonInput ? (
        <div className="w-full max-w-6xl bg-amber-950/90 border border-amber-500/40 p-4 rounded-2xl shadow-2xl text-white space-y-3 shrink-0 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" /> Select Re-upload / Rejection Reason
            </h4>
            <button
              onClick={() => setShowRejectReasonInput(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {presetReasons.map((reason, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedReason(reason);
                  setCustomReason(reason);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedReason === reason
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-amber-900/40 border-amber-800 text-amber-200 hover:bg-amber-900'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            placeholder="Or enter custom instruction for partner..."
            className="w-full p-2.5 bg-slate-900 border border-amber-700/60 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowRejectReasonInput(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              Back
            </button>
            <button
              disabled={isSubmitting}
              onClick={handleConfirmReject}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Send Re-upload Request
            </button>
          </div>
        </div>
      ) : (
        /* Action Footer Bar */
        <div className="w-full max-w-6xl bg-slate-900/90 border border-slate-800 px-6 py-3 rounded-2xl shadow-2xl flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            {rejectionReason ? (
              <span className="text-amber-400 font-semibold">Note: {rejectionReason}</span>
            ) : (
              <span>Inspect image clarity, completeness, and matching name before verifying.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={isSubmitting}
              onClick={() => setShowRejectReasonInput(true)}
              className="px-4 py-2 bg-amber-600/20 border border-amber-500/40 hover:bg-amber-600/30 text-amber-300 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Request Re-upload
            </button>

            <button
              disabled={isSubmitting}
              onClick={handleConfirmAccept}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" /> Accept Document (Verify)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
