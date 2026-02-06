import React from 'react';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ATSAnalysis, CareerMatch } from '../types';

interface AnalysisChartsProps {
  data: ATSAnalysis;
}

export const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const data = [
    {
      name: 'Score',
      uv: score,
      fill: score > 80 ? '#22c55e' : score > 50 ? '#eab308' : '#ef4444',
    },
    {
      name: 'Max',
      uv: 100,
      fill: '#e2e8f0',
    }
  ];

  return (
    <div className="relative h-48 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={data} startAngle={180} endAngle={0}>
          <RadialBar
            background
            dataKey="uv"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 text-center">
        <span className={`text-4xl font-bold ${score > 80 ? 'text-green-600' : score > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
          {score}
        </span>
        <p className="text-xs text-slate-500 uppercase tracking-wide">Puntaje ATS</p>
      </div>
    </div>
  );
};

export const CategoryBreakdown: React.FC<{ data: ATSAnalysis }> = ({ data }) => {
  const chartData = [
    { name: 'Palabras Clave', score: data.keywordMatch },
    { name: 'Formato', score: data.formattingScore },
    { name: 'Impacto', score: data.impactScore },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
        <Tooltip cursor={{fill: 'transparent'}} />
        <Bar dataKey="score" barSize={20} radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.score > 70 ? '#3b82f6' : '#94a3b8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export const CareerMatchList: React.FC<{ matches: CareerMatch[] }> = ({ matches }) => {
  return (
    <div className="space-y-4">
      {matches.map((match, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between items-end">
            <div>
                <span className="block text-sm font-bold text-slate-700">{match.role}</span>
                <span className="block text-xs text-slate-500">{match.industry}</span>
            </div>
            <span className="text-sm font-bold text-blue-600">{match.matchPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                match.matchPercentage > 85 ? 'bg-green-500' : match.matchPercentage > 60 ? 'bg-yellow-500' : 'bg-slate-400'
              }`} 
              style={{ width: `${match.matchPercentage}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};