import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Briefcase, ArrowRight, RefreshCw, ChevronLeft, Maximize2, Target, LogOut } from 'lucide-react';
import { AppState, ATSAnalysis, OptimizationResult, TailoredResult, User } from './types';
import * as GeminiService from './services/gemini';
import { ScoreGauge, CategoryBreakdown, CareerMatchList } from './components/AnalysisCharts';
import { CVDisplay } from './components/CVDisplay';
import { AnalysisModal } from './components/AnalysisModal';
import { AuthScreen } from './components/AuthScreen';

const MIN_CV_LENGTH = 100;

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App Logic State
  const [currentState, setCurrentState] = useState<AppState>(AppState.INPUT);
  const [cvText, setCvText] = useState<string>('');
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [optimizedCV, setOptimizedCV] = useState<OptimizationResult | null>(null);
  
  // Job Tailoring State
  const [jobDescription, setJobDescription] = useState<string>('');
  const [tailoredResult, setTailoredResult] = useState<TailoredResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  const handleAnalyze = async () => {
    const trimmedText = cvText.trim();

    // Strict Validations
    if (!trimmedText) {
      setErrorMsg("El campo no puede estar vacío. Por favor, ingresa el texto de tu CV.");
      return;
    }

    if (trimmedText.length < MIN_CV_LENGTH) {
      setErrorMsg(`El contenido es demasiado corto (${trimmedText.length} caracteres). Se requiere un mínimo de ${MIN_CV_LENGTH} caracteres para un análisis ATS preciso.`);
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setCurrentState(AppState.ANALYZING);

    try {
      // 1. Analyze
      const analysisResult = await GeminiService.analyzeCV(trimmedText);
      setAnalysis(analysisResult);
      
      // 2. Auto-optimize
      const optimizedResult = await GeminiService.optimizeCV(trimmedText, analysisResult);
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

  const handleLogout = () => {
    setCurrentUser(null);
    // Reset App State
    setCurrentState(AppState.INPUT);
    setCvText('');
    setAnalysis(null);
    setOptimizedCV(null);
  };

  // If not logged in, show Auth Screen
  if (!currentUser) {
    return <AuthScreen onLogin={setCurrentUser} />;
  }

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

        <div className="relative">
          <textarea
            className={`w-full h-64 p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-slate-50 font-mono text-sm ${
              errorMsg ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'
            }`}
            placeholder="Pega aquí el contenido de tu CV (texto plano)..."
            value={cvText}
            onChange={(e) => {
              setCvText(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
          />
          <div className={`absolute bottom-4 right-4 text-xs font-medium px-2 py-1 rounded-md transition-colors ${
            cvText.trim().length > 0 && cvText.trim().length < MIN_CV_LENGTH
              ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {cvText.trim().length} / {MIN_CV_LENGTH} min
          </div>
        </div>

        <div className="mt-6 flex flex-col items-end gap-3">
          <button
            onClick={handleAnalyze}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-xl w-full sm:w-auto justify-center ${
              isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? 'Procesando...' : 'Analizar y Optimizar'}
            {!isProcessing && <ArrowRight size={20} />}
          </button>
          
          {errorMsg && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg w-full border border-red-100 animate-in fade-in slide-in-from-top-1">
              <AlertTriangle size={18} className="flex-shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>
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
            {/* Header for Analysis with Expand Button */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-700">Reporte de Análisis</h2>
                <button 
                  onClick={() => setIsAnalysisModalOpen(true)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Maximize2 size={16} />
                  Ampliar
                </button>
            </div>

            {/* Score Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CheckCircle size={20} className="text-blue-600" /> Diagnóstico ATS
                </h3>
                <ScoreGauge score={analysis.overallScore} />
                <CategoryBreakdown data={analysis} />
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 line-clamp-3">
                   {analysis.summary}
                </div>
            </div>

            {/* Career Matches (Job Fit) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Target size={20} className="text-indigo-600" /> Cargos Sugeridos
                </h3>
                <CareerMatchList matches={analysis.careerMatches} />
            </div>

            {/* Keywords Analysis (Preview) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Palabras Clave</h3>
                <div className="mb-4">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2">Encontradas (Top)</p>
                    <div className="flex flex-wrap gap-2">
                        {analysis.foundKeywords.slice(0, 5).map((k, i) => (
                            <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">{k}</span>
                        ))}
                        {analysis.foundKeywords.length > 5 && (
                           <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-full font-medium">+{analysis.foundKeywords.length - 5}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Optimized CV & Tailor Action */}
        <div className="lg:col-span-8 flex flex-col h-full">
            {/* Primary Action Button placed prominently at the top */}
            <div className="mb-4 flex gap-4 items-center">
                <div className="flex-1 bg-blue-50 border border-blue-100 p-3 rounded-xl text-blue-800 text-sm">
                    <strong>Estrategia:</strong> {optimizedCV.rationale}
                </div>
                <button
                    onClick={() => setCurrentState(AppState.TAILORING)}
                    className="flex-shrink-0 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2 hover:scale-105"
                >
                    <Briefcase size={20} />
                    Personalizar para Empleo
                    <ArrowRight size={18} />
                </button>
            </div>

            <div className="flex-1 min-h-0">
                <CVDisplay markdown={optimizedCV.markdownCV} title="Versión Optimizada para ATS" />
            </div>
        </div>

        {/* Modal */}
        <AnalysisModal 
            isOpen={isAnalysisModalOpen} 
            onClose={() => setIsAnalysisModalOpen(false)} 
            analysis={analysis} 
        />
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
          
          <div className="flex items-center gap-6">
            <div className="flex gap-4 text-sm font-medium text-slate-500">
                <span className={currentState === AppState.INPUT ? 'text-blue-600' : ''}>1. Cargar</span>
                <span className="text-slate-300">/</span>
                <span className={currentState === AppState.RESULTS ? 'text-blue-600' : ''}>2. Análisis</span>
                <span className="text-slate-300">/</span>
                <span className={currentState === AppState.TAILORING ? 'text-blue-600' : ''}>3. Personalizar</span>
            </div>

            <div className="h-6 w-px bg-slate-200"></div>

            <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 font-medium hidden sm:block">Hola, {currentUser.name}</span>
                <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Cerrar Sesión"
                >
                    <LogOut size={18} />
                </button>
            </div>
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