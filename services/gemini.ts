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
    summary: { type: Type.STRING, description: "Resumen ejecutivo del análisis" },
  },
  required: ["overallScore", "keywordMatch", "formattingScore", "impactScore", "foundKeywords", "missingKeywords", "criticalIssues", "improvementSuggestions", "summary"],
};

const tailoredSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    markdownCV: { type: Type.STRING, description: "El CV completo reescrito en Markdown" },
    matchScore: { type: Type.NUMBER, description: "Nuevo puntaje de coincidencia con el aviso (0-100)" },
    changesMade: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de cambios estratégicos realizados" },
  },
  required: ["markdownCV", "matchScore", "changesMade"],
};


export const analyzeCV = async (cvText: string): Promise<ATSAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza el siguiente texto de CV:\n\n${cvText}`,
      config: {
        systemInstruction: ATS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
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
    
    Genera un CV optimizado en Markdown y una breve explicación de por qué es mejor.
    Devuelve un JSON con propiedades "markdownCV" y "rationale".
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
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    return JSON.parse(text) as OptimizationResult;
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

    Adapta el CV al aviso.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: TAILOR_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: tailoredSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    return JSON.parse(text) as TailoredResult;
  } catch (error) {
    console.error("Error tailoring CV:", error);
    throw error;
  }
};
