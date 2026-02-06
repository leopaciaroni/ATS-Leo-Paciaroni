import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Download } from 'lucide-react';

interface CVDisplayProps {
  markdown: string;
  title: string;
}

export const CVDisplay: React.FC<CVDisplayProps> = ({ markdown, title }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    alert("CV copiado al portapapeles");
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([markdown], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = "cv_optimizado.md";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <div className="flex gap-2">
          <button 
            onClick={handleCopy}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Copiar texto"
          >
            <Copy size={18} />
          </button>
          <button 
            onClick={handleDownload}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Descargar Markdown"
          >
            <Download size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-white prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
};
