import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Activity
} from 'lucide-react';

import type { AnalysisResponse, DemoPreset, HistoryItem } from './types/analyzer';
import { analyzeUrl, analyzeQRImage, fetchPresets } from './utils/api';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { VerdictCard } from './components/VerdictCard';
import { RedirectTimeline } from './components/RedirectTimeline';
import { UpiDetails } from './components/UpiDetails';
import { FeatureBreakdown } from './components/FeatureBreakdown';
import { DemoPresets } from './components/DemoPresets';
import { HistoryDrawer } from './components/HistoryDrawer';
import { QRScannerModal } from './components/QRScannerModal';

export const App: React.FC = () => {
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<DemoPreset[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('qrshield_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'redirects' | 'features'>('details');

  // Load presets on mount
  useEffect(() => {
    fetchPresets().then(setPresets);
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qrshield_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to persist history to localStorage', e);
    }
  }, [history]);

  const addHistoryItem = (res: AnalysisResponse) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      input: res.input,
      verdict: res.verdict,
      risk_score: res.risk_score,
      category: res.category,
      summary: res.summary
    };
    setHistory(prev => [newItem, ...prev.slice(0, 19)]); // Keep last 20
  };

  const handleAnalyzeUrl = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeUrl(url);
      setResult(data);
      addHistoryItem(data);
      // Auto-select most appropriate technical tab
      if (data.upi_details) {
        setActiveTab('details');
      } else if (data.redirect_chain && data.redirect_chain.total_hops > 1) {
        setActiveTab('redirects');
      } else {
        setActiveTab('features');
      }
    } catch (err: any) {
      setError(err.message || 'Inspection failed. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeQRImage(file);
      setResult(data);
      if (data.success) {
        addHistoryItem(data);
        if (data.upi_details) {
          setActiveTab('details');
        } else if (data.redirect_chain && data.redirect_chain.total_hops > 1) {
          setActiveTab('redirects');
        } else {
          setActiveTab('features');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Image QR inspection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (preset: DemoPreset) => {
    handleAnalyzeUrl(preset.payload);
  };

  const handleCameraScanSuccess = (decodedText: string) => {
    setIsCameraOpen(false);
    handleAnalyzeUrl(decodedText);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    handleAnalyzeUrl(item.input);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 cyber-grid-pattern relative">
      
      {/* Glow gradient blobs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <Header
        onToggleHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Pitch Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold tracking-wide">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>AI + HEURISTIC SCAM QR & PAYMENT LINK ANALYZER</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Stop Phishing & Fraud <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Before You Authorize
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Decodes QR codes, inspects deceptive UPI intent debit traps, unmasks shortened multi-hop redirects in an isolated sandbox, and outputs plain-language verdicts in under 2 seconds.
          </p>
        </div>

        {/* 1-Click Pitch Demonstration Sandbox */}
        <DemoPresets
          presets={presets}
          onSelectPreset={handlePresetSelect}
          isLoading={isLoading}
        />

        {/* Input Interface: Paste URL / Upload Image / Camera */}
        <InputSection
          onAnalyzeUrl={handleAnalyzeUrl}
          onAnalyzeFile={handleAnalyzeFile}
          onOpenLiveCamera={() => setIsCameraOpen(true)}
          isLoading={isLoading}
        />

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Verdict & Detailed Technical Output */}
        {result && (
          <div className="space-y-6 pt-2">
            
            {/* Primary Visual Verdict Card */}
            <VerdictCard result={result} />

            {/* Technical Inspection Tabs */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
                {result.upi_details && (
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      activeTab === 'details'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
                    }`}
                  >
                    UPI Payment Intent
                  </button>
                )}

                {result.redirect_chain && (
                  <button
                    onClick={() => setActiveTab('redirects')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      activeTab === 'redirects'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
                    }`}
                  >
                    Redirect Chain ({result.redirect_chain.total_hops} Hop{result.redirect_chain.total_hops > 1 ? 's' : ''})
                  </button>
                )}

                {result.features && (
                  <button
                    onClick={() => setActiveTab('features')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      activeTab === 'features'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
                    }`}
                  >
                    Threat Vectors & Entropy
                  </button>
                )}
              </div>

              {/* Tab Contents */}
              {activeTab === 'details' && result.upi_details && (
                <UpiDetails upi={result.upi_details} />
              )}

              {activeTab === 'redirects' && result.redirect_chain && (
                <RedirectTimeline chain={result.redirect_chain} />
              )}

              {activeTab === 'features' && result.features && (
                <FeatureBreakdown features={result.features} />
              )}
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d16]/90 py-6 mt-16 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 QRShield • Presidency University × ISACA Bangalore Chapter Hackathon</p>
          <div className="flex items-center gap-4">
            <span className="text-cyan-400 font-semibold">Team DARKBYTE</span>
            <span>•</span>
            <span>Problem Statement 05</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <QRScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistory={handleSelectHistoryItem}
        onClearHistory={() => setHistory([])}
      />

    </div>
  );
};

export default App;
