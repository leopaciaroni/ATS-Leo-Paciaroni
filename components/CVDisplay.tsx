import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Printer, FileText, Check } from 'lucide-react';

interface CVDisplayProps {
  markdown: string;
  title: string;
}

export const CVDisplay: React.FC<CVDisplayProps> = ({ markdown, title }) => {
  const [isCopied, setIsCopied] = useState(false);

  // Extra safety to remove code blocks if they slip through the service layer
  const cleanContent = markdown.replace(/^```markdown\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    const content = document.getElementById('printable-cv')?.innerHTML;
    if (!content) return;
    
    // Improved HTML wrapper for Word compatibility
    // We add explicit @page CSS to define margins and size, making it behave like a doc.
    const preHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>CV Export</title>
        <!--[if gte mso 9]>
        <xml>
        <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 8.5in 11in;
            margin: 1.0in;
            mso-header-margin: 0.5in;
            mso-footer-margin: 0.5in;
            mso-paper-source: 0;
          }
          body { 
            font-family: 'Calibri', 'Arial', sans-serif; 
            font-size: 11pt; 
            line-height: 1.15; 
            color: #000000;
            background-color: #FFFFFF;
          }
          /* Headings */
          h1 { font-size: 24pt; font-weight: bold; color: #2E74B5; margin-bottom: 4px; text-transform: uppercase; }
          h2 { font-size: 14pt; font-weight: bold; color: #2E74B5; margin-top: 16px; margin-bottom: 8px; border-bottom: 1px solid #2E74B5; padding-bottom: 2px; text-transform: uppercase; }
          h3 { font-size: 12pt; font-weight: bold; color: #333333; margin-top: 12px; margin-bottom: 2px; }
          
          /* Text elements */
          p { margin-bottom: 6px; margin-top: 0; }
          strong { font-weight: bold; color: #333333; }
          ul { margin-top: 2px; margin-bottom: 8px; margin-left: 20px; padding-left: 0; }
          li { margin-bottom: 2px; mso-list:l0 level1 lfo1; }
          a { color: #0563C1; text-decoration: none; }
          hr { border: 0; border-bottom: 1px solid #CCC; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
    `;
    const postHtml = "</div></body></html>";
    const html = preHtml + content + postHtml;

    const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
    });
    
    const element = document.createElement("a");
    // Explicitly using .doc extension which triggers Word's legacy HTML converter
    // This is the standard way to open HTML as Word without a converter library.
    element.href = URL.createObjectURL(blob);
    element.download = `CV_Optimizado_ATS_${new Date().toISOString().slice(0,10)}.doc`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print">
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <div className="flex gap-2">
          <button 
            onClick={handleExportWord}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors text-sm font-medium"
            title="Descargar como Word (.doc)"
          >
            <FileText size={16} />
            Exportar Word
          </button>
          <button 
            onClick={handlePrint}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Imprimir / Guardar como PDF"
          >
            <Printer size={18} />
          </button>
          <button 
            onClick={handleCopy}
            className={`p-2 rounded-md transition-all duration-200 ${
              isCopied 
                ? 'text-green-600 bg-green-50 ring-2 ring-green-100' 
                : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title={isCopied ? "¡Copiado!" : "Copiar texto"}
          >
            {isCopied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8 bg-white">
        <div id="printable-cv" className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-700 prose-li:text-slate-700 font-serif leading-relaxed">
            <ReactMarkdown>{cleanContent}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};