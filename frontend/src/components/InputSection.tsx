import React, { useState, useRef } from 'react';
import { Search, Upload, Camera, Link, QrCode, ArrowRight, Loader2, X } from 'lucide-react';

interface InputSectionProps {
  onAnalyzeUrl: (url: string) => void;
  onAnalyzeFile: (file: File) => void;
  onOpenLiveCamera: () => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  onAnalyzeUrl,
  onAnalyzeFile,
  onOpenLiveCamera,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'upload'>('link');
  const [urlInput, setUrlInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || isLoading) return;
    onAnalyzeUrl(urlInput.trim());
  };

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleStartFileScan = () => {
    if (selectedFile && !isLoading) {
      onAnalyzeFile(selectedFile);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Decorative cyber line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-80" />

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'link'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Paste URL or UPI Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload QR Image</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenLiveCamera}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-cyan-900/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Live Camera Scan</span>
          <span className="sm:hidden">Camera</span>
        </button>
      </div>

      {/* Tab 1: Direct Link Paste */}
      {activeTab === 'link' && (
        <form onSubmit={handleSubmitUrl} className="space-y-3">
          <div className="relative flex items-center">
            <div className="absolute left-4 pointer-events-none text-slate-500">
              <Search className="w-5 h-5 text-cyan-500" />
            </div>

            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste any link: https://... or upi://pay?pa=merchant@icici&pn=..."
              className="w-full pl-12 pr-28 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-all"
            />

            {urlInput && (
              <button
                type="button"
                onClick={() => setUrlInput('')}
                className="absolute right-28 text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !urlInput.trim()}
              className="absolute right-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Inspecting...</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1 font-mono">
            <span className="text-cyan-400">Accepted:</span>
            <span>Web URLs (HTTP/HTTPS), Shortened Links (bit.ly/tinyurl), and UPI Intents (upi://pay, upi://collect).</span>
          </div>
        </form>
      )}

      {/* Tab 2: Upload QR Image */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            accept="image/*"
            className="hidden"
          />

          {!selectedFile ? (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="p-3 rounded-full bg-slate-800/80 text-cyan-400 mb-1">
                  <QrCode className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Drag and drop your QR code image here, or <span className="text-cyan-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-500">
                  Supports PNG, JPG, JPEG, WEBP (Max 10MB)
                </p>
              </div>
            </div>

            {/* Quick-test Sample QRs */}
            <div className="pt-2">
              <span className="text-[11px] font-mono text-slate-400 mb-2 block">
                Or quickly test with a pre-generated sample QR image:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { name: 'Starbucks Safe Merchant', file: 'safe_merchant_starbucks.png', verdict: 'SAFE' },
                  { name: 'GPay Cashback Scam Trap', file: 'scam_gpay_cashback_trap.png', verdict: 'SCAM' },
                  { name: 'SBI Phishing Portal', file: 'phishing_sbi_portal.png', verdict: 'PHISH' },
                  { name: 'PayPal Homoglyph IDN', file: 'homoglyph_paypal_portal.png', verdict: 'SPOOF' },
                  { name: 'Shortened Redirect Link', file: 'shortened_redirect_link.png', verdict: 'CHAIN' },
                  { name: 'Unreachable Domain Host', file: 'unreachable_test_domain.png', verdict: 'TIMEOUT' },
                ].map((sample) => (
                  <button
                    key={sample.file}
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const res = await fetch(`/samples/${sample.file}`);
                        const blob = await res.blob();
                        const file = new File([blob], sample.file, { type: 'image/png' });
                        handleFileChange(file);
                      } catch (err) {
                        console.error('Failed to load sample QR', err);
                      }
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group"
                  >
                    <img
                      src={`/samples/${sample.file}`}
                      alt={sample.name}
                      className="w-8 h-8 rounded border border-slate-700 bg-white p-0.5 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-300 truncate group-hover:text-cyan-300">
                        {sample.name}
                      </p>
                      <span className="text-[10px] font-mono text-cyan-400">
                        Load Sample QR
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              {previewUrl && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0 bg-black flex items-center justify-center">
                  <img src={previewUrl} alt="QR Preview" className="w-full h-full object-contain" />
                </div>
              )}

              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-sm font-medium text-slate-200 truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB • Image Loaded</p>
                <p className="text-xs text-cyan-400 mt-1">Ready for multi-stage OpenCV & preprocessing decode</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearFile}
                  disabled={isLoading}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all text-xs"
                >
                  <X className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleStartFileScan}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-all shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Decoding & Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>Decode & Scan QR</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
