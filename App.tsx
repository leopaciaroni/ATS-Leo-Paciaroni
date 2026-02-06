import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Briefcase, ArrowRight, RefreshCw, ChevronLeft } from 'lucide-react';
import { AppState, ATSAnalysis, OptimizationResult, TailoredResult } from './types';
import * as GeminiService from './services/gemini';
import { ScoreGauge, CategoryBreakdown } from './components/AnalysisCharts';
import { CVDisplay } from './components/CVDisplay';

const App: React.FC = () => {
  const [currentState, setCurrentState] = useState<AppState>(AppState.INPUT);
  const [cvText, setCvText] = useState<string>('');
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [optimizedCV, setOptimizedCV] = useState<OptimizationResult | null>(null);
  
  // Job Tailoring State
  const [jobDescription, setJobDescription] = useState<string>('');
  const [tailoredResult, setTailoredResult] = useState<TailoredResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!cvText.trim()) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setCurrentState(AppState.ANALYZING);

    try {
      // 1. Analyze
      const analysisResult = await GeminiService.analyzeCV(cvText);
      setAnalysis(analysisResult);
      
      // 2. Auto-optimize
      const optimizedResult = await GeminiService.optimizeCV(cvText, analysisResult);
      setOptimizedCV(optimizedResult);

      setCurrentState(AppState.RESULTS);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al procesar el CV. Verifica tu conexión o intenta con un texto más corto.");
      setCurrentState(AppState.INPUT);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTailor = async () => {
    if (!jobDescription.trim() || !optimizedCV) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const result = await GeminiService.tailorCVToJob(optimizedCV.markdownCV, jobDescription);
      setTailoredResult(result);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al personalizar el CV.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Render Functions

  const renderInput = () => (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="text-blue-600" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Carga tu CV</h2>
          <p className="text-slate-500 mt-2">Pega el texto de tu CV para un análisis ATS profundo.</p>
        </div>

        <textarea
          className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-slate-50 font-mono text-sm"
          placeholder="Pega aquí el contenido de tu CV (texto plano)..."
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
        />

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={!cvText.trim() || isProcessing}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-xl ${
              !cvText.trim() ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? 'Procesando...' : 'Analizar y Optimizar'}
            {!isProcessing && <ArrowRight size={20} />}
          </button>
        </div>
        {errorMsg && <p className="mt-4 text-red-500 text-center text-sm">{errorMsg}</p>}
      </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <RefreshCw className="text-blue-600 animate-pulse" size={32} />
        </div>
      </div>
      <h3 className="mt-8 text-2xl font-bold text-slate-700">Analizando CV...</h3>
      <p className="text-slate-500 mt-2">Simulando algoritmos ATS (Taleo, Workday)...</p>
    </div>
  );

  const renderResults = () => {
    if (!analysis || !optimizedCV) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
        
        {/* Left Column: Analysis & Stats */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 pb-10">
            {/* Score Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CheckCircle size={20} className="text-blue-600" /> Diagnóstico ATS
                </h3>
                <ScoreGauge score={analysis.overallScore} />
                <CategoryBreakdown data={analysis} />
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                   {analysis.summary}
                </div>
            </div>

            {/* Critical Issues */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-amber-500" /> Problemas Críticos
                </h3>
                <ul className="space-y-2">
                    {analysis.criticalIssues.map((issue, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-red-500 mt-1">•</span> {issue}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Keywords Analysis */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Palabras Clave</h3>
                <div className="mb-4">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2">Encontradas</p>
                    <div className="flex flex-wrap gap-2">
                        {analysis.foundKeywords.map((k, i) => (
                            <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">{k}</span>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2">Faltantes Sugeridas</p>
                    <div className="flex flex-wrap gap-2">
                        {analysis.missingKeywords.map((k, i) => (
                            <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">{k}</span>
                        ))}
                    </div>
                </div>
            </div>

             <button
              onClick={() => setCurrentState(AppState.TAILORING)}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <Briefcase size={20} />
              Personalizar para Empleo
            </button>
        </div>

        {/* Right Column: Optimized CV */}
        <div className="lg:col-span-8 flex flex-col h-full">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4 text-blue-800 text-sm">
                <strong>Estrategia de Optimización:</strong> {optimizedCV.rationale}
            </div>
            <div className="flex-1 min-h-0">
                <CVDisplay markdown={optimizedCV.markdownCV} title="Versión Optimizada para ATS" />
            </div>
        </div>
      </div>
    );
  };

  const renderTailoring = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        {/* Left: Input Job Description */}
        <div className="flex flex-col h-full bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setCurrentState(AppState.RESULTS)} className="p-1 hover:bg-slate-100 rounded">
                    <ChevronLeft size={24} className="text-slate-600" />
                </button>
                <h3 className="text-xl font-bold text-slate-800">Descripción del Empleo</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">Pega aquí el aviso de LinkedIn o el portal de empleo.</p>
            <textarea 
                className="flex-1 w-full p-4 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-sm"
                placeholder="Pegar Job Description aquí..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
            />
            <button
                onClick={handleTailor}
                disabled={isProcessing || !jobDescription.trim()}
                className="mt-4 w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-colors flex justify-center items-center gap-2"
            >
                {isProcessing ? 'Adaptando CV...' : 'Generar CV Personalizado'}
                {!isProcessing && <RefreshCw size={18} />}
            </button>
        </div>

        {/* Right: Result */}
        <div className="flex flex-col h-full">
            {tailoredResult ? (
                <>
                    <div className="bg-green-50 border border-green-100 p-4 rounded-xl mb-4">
                         <div className="flex justify-between items-center mb-2">
                             <span className="font-bold text-green-800">Match con Aviso: {tailoredResult.matchScore}%</span>
                         </div>
                         <div className="text-xs text-green-700">
                             <span className="font-semibold">Cambios clave:</span> {tailoredResult.changesMade.join(', ')}
                         </div>
                    </div>
                    <div className="flex-1 min-h-0">
                         <CVDisplay markdown={tailoredResult.markdownCV} title="CV Personalizado al Cargo" />
                    </div>
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                    <FileText size={48} className="mb-4 opacity-50" />
                    <p>El resultado personalizado aparecerá aquí</p>
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
                <FileText className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              ATS Master Pro
            </h1>
          </div>
          <div className="flex gap-4 text-sm font-medium text-slate-500">
            <span className={currentState === AppState.INPUT ? 'text-blue-600' : ''}>1. Cargar</span>
            <span className="text-slate-300">/</span>
            <span className={currentState === AppState.RESULTS ? 'text-blue-600' : ''}>2. Análisis</span>
            <span className="text-slate-300">/</span>
            <span className={currentState === AppState.TAILORING ? 'text-blue-600' : ''}>3. Personalizar</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentState === AppState.INPUT && renderInput()}
        {currentState === AppState.ANALYZING && renderAnalyzing()}
        {currentState === AppState.RESULTS && renderResults()}
        {currentState === AppState.TAILORING && renderTailoring()}
      </main>
    </div>
  );
};

export default App;
