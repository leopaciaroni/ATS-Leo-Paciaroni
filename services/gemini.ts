import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ATSAnalysis, OptimizationResult, TailoredResult } from "../types";
import { ATS_SYSTEM_INSTRUCTION, OPTIMIZER_SYSTEM_INSTRUCTION, TAILOR_SYSTEM_INSTRUCTION } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema Definitions
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER, description: "Puntaje general del 0 al 100" },
    keywordMatch: { type: Type.NUMBER, description: "Puntaje de coincidencia de palabras clave (0-100)" },
    formattingScore: { type: Type.NUMBER, description: "Puntaje de formato y estructura (0-100)" },
    impactScore: { type: Type.NUMBER, description: "Puntaje de impacto y métricas (0-100)" },
    foundKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Palabras clave importantes encontradas" },
    missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Palabras clave que faltan y son comunes en este perfil" },
    criticalIssues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Problemas graves que impiden la lectura del ATS" },
    improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Sugerencias concretas de mejora" },
    careerMatches: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING, description: "Nombre del cargo sugerido (Ej: Gerente de Operaciones)" },
          industry: { type: Type.STRING, description: "Industria aplicable (Ej: Minería / Retail)" },
          matchPercentage: { type: Type.NUMBER, description: "Porcentaje de ajuste al perfil (0-100)" }
        }
      },
      description: "Lista de 3-4 cargos sugeridos donde el perfil calza bien"
    },
    summary: { type: Type.STRING, description: "Resumen ejecutivo del análisis" },
  },
  required: ["overallScore", "keywordMatch", "formattingScore", "impactScore", "foundKeywords", "missingKeywords", "criticalIssues", "improvementSuggestions", "careerMatches", "summary"],
};

const tailoredSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    markdownCV: { type: Type.STRING, description: "El CV completo reescrito en Markdown limpio" },
    matchScore: { type: Type.NUMBER, description: "Nuevo puntaje de coincidencia con el aviso (0-100)" },
    changesMade: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de cambios estratégicos realizados" },
  },
  required: ["markdownCV", "matchScore", "changesMade"],
};

// Helper to remove markdown code fences if the AI adds them despite instructions
const cleanMarkdown = (text: string): string => {
  return text.replace(/^```markdown\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
};

export const analyzeCV = async (cvText: string): Promise<ATSAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza el siguiente texto de CV de forma objetiva:\n\n${cvText}`,
      config: {
        systemInstruction: ATS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0, // CRITICAL: Set to 0 for deterministic, consistent results
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    return JSON.parse(text) as ATSAnalysis;
  } catch (error) {
    console.error("Error analyzing CV:", error);
    throw error;
  }
};

export const optimizeCV = async (cvText: string, analysis: ATSAnalysis): Promise<OptimizationResult> => {
  try {
    const prompt = `
    CV Original:
    ${cvText}

    Análisis ATS Previo (Puntos a mejorar):
    ${JSON.stringify(analysis.improvementSuggestions)}
    
    Genera un CV optimizado en Markdown y una breve explicación.
    Asegúrate de que el output 'markdownCV' sea texto markdown limpio, sin bloques de código.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: OPTIMIZER_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                markdownCV: { type: Type.STRING },
                rationale: { type: Type.STRING }
            }
        },
        temperature: 0.2, // Low temperature for focused writing
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    const result = JSON.parse(text) as OptimizationResult;
    
    // Clean the markdown output
    result.markdownCV = cleanMarkdown(result.markdownCV);
    
    return result;
  } catch (error) {
    console.error("Error optimizing CV:", error);
    throw error;
  }
};

export const tailorCVToJob = async (cvText: string, jobDescription: string): Promise<TailoredResult> => {
  try {
    const prompt = `
    CV Actual:
    ${cvText}

    Descripción del Trabajo (Job Ad):
    ${jobDescription}

    Adapta el CV al aviso. Devuelve markdown limpio.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: TAILOR_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: tailoredSchema,
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    const result = JSON.parse(text) as TailoredResult;
    
    // Clean the markdown output
    result.markdownCV = cleanMarkdown(result.markdownCV);
    
    return result;
  } catch (error) {
    console.error("Error tailoring CV:", error);
    throw error;
  }
};