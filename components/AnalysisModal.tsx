import React from 'react';
import { X, CheckCircle, AlertTriangle, Lightbulb, Target, Download, Printer } from 'lucide-react';
import { ATSAnalysis } from '../types';
import { ScoreGauge, CategoryBreakdown, CareerMatchList } from './AnalysisCharts';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: ATSAnalysis;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, analysis }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:p-0 print:bg-white print:static">
      {/* Styles specifically for printing the modal content */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #analysis-report, #analysis-report * {
              visibility: visible;
            }
            #analysis-report {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 20px;
              background: white;
              overflow: visible !important;
              max-height: none !important;
              box-shadow: none !important;
            }
            .no-print {
              display: none !important;
            }
            /* Force charts to print */
            .recharts-responsive-container {
               width: 100% !important;
               height: auto !important;
            }
          }
        `}
      </style>

      <div id="analysis-report" className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col print:shadow-none print:max-h-none print:w-full print:rounded-none">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 print:bg-white print:border-b-2 print:border-slate-800">
          <div className="flex items-center gap-3">
             <div className="bg-blue-100 p-2 rounded-lg print:hidden">
                <CheckCircle className="text-blue-600" size={24} />
             </div>
             <div>
                <h2 className="text-2xl font-bold text-slate-800">Reporte ATS Detallado</h2>
                <p className="text-sm text-slate-500">Análisis profundo de compatibilidad</p>
             </div>
          </div>
          <div className="flex gap-2 no-print">
            <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
                <Printer size={16} /> Exportar PDF
            </button>
            <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
            >
                <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-white print:overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 print:grid-cols-3">
                {/* Score */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-center print:border print:bg-white">
                    <h3 className="font-semibold text-slate-700 mb-4">Puntaje General</h3>
                    <ScoreGauge score={analysis.overallScore} />
                </div>
                
                {/* Breakdown */}
                <div className="md:col-span-2 bg-slate-50 p-6 rounded-xl border border-slate-100 print:border print:bg-white">
                    <h3 className="font-semibold text-slate-700 mb-4">Desglose por Categoría</h3>
                    <CategoryBreakdown data={analysis} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
                {/* Summary & Suggestions */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-3">Resumen Ejecutivo</h3>
                        <p className="text-slate-600 leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-100 print:bg-white print:border-slate-300">
                            {analysis.summary}
                        </p>
                    </div>

                    {/* Career Matches */}
                    <div>
                         <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Target size={20} className="text-indigo-600" />
                            Cargos Sugeridos (Job Fit)
                        </h3>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
                             <CareerMatchList matches={analysis.careerMatches} />
                        </div>
                    </div>

                    <div>
                         <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Lightbulb size={20} className="text-amber-500" />
                            Sugerencias de Mejora
                        </h3>
                        <ul className="space-y-3">
                            {analysis.improvementSuggestions.map((sug, i) => (
                                <li key={i} className="flex gap-3 text-slate-700 bg-amber-50 p-3 rounded-lg border border-amber-100 print:bg-white print:border-slate-300">
                                    <span className="font-bold text-amber-500">{i + 1}.</span>
                                    {sug}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Critical Issues & Keywords */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-red-500" />
                            Problemas Críticos
                        </h3>
                        <ul className="space-y-2">
                            {analysis.criticalIssues.length > 0 ? (
                                analysis.criticalIssues.map((issue, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-slate-700 p-2 hover:bg-red-50 rounded transition-colors print:p-0">
                                        <span className="text-red-500 mt-1">•</span> {issue}
                                    </li>
                                ))
                            ) : (
                                <p className="text-green-600 italic">¡No se encontraron problemas críticos!</p>
                            )}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-3">Análisis de Palabras Clave</h3>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
                            <div className="mb-4">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Encontradas</p>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.foundKeywords.map((k, i) => (
                                        <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium print:border print:border-green-300">{k}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Faltantes (Recomendadas)</p>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.missingKeywords.map((k, i) => (
                                        <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium print:border print:border-red-300">{k}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end no-print">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
            >
                Cerrar
            </button>
        </div>
      </div>
    </div>
  );
};