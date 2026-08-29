'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend } from 'recharts';
import { usePlayerRadar } from '@/hooks/useApi';

interface PlayerRadarProps {
  playerId: string;
  seasonId: string;
  competitionId?: string;
  className?: string;
  comparePlayerId?: string;
}

const METRICS_CONFIG = [
  { key: 'goals', label: 'Goals', max: 30 },
  { key: 'assists', label: 'Assists', max: 15 },
  { key: 'xG', label: 'xG', max: 25 },
  { key: 'xA', label: 'xA', max: 12 },
  { key: 'shots', label: 'Shots', max: 100 },
  { key: 'keyPasses', label: 'Key Passes', max: 50 },
  { key: 'dribblesWon', label: 'Dribbles Won', max: 80 },
  { key: 'tacklesWon', label: 'Tackles Won', max: 60 },
  { key: 'interceptions', label: 'Interceptions', max: 50 },
  { key: 'passAccuracy', label: 'Pass %', max: 100 },
];

export function PlayerRadar({ playerId, seasonId, competitionId, className, comparePlayerId }: PlayerRadarProps) {
  const { data: radarData, isLoading } = usePlayerRadar(playerId, seasonId, competitionId);
  const { data: compareData } = usePlayerRadar(comparePlayerId || '', seasonId, competitionId);

  if (isLoading) return ( <div className={className} style={{ height: 400 }}> <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200"> <div className="animate-pulse text-slate-400">Loading radar chart...</div> </div> </div> );
  if (!radarData?.length) return ( <div className={className} style={{ height: 400 }}> <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200"> <p className="text-slate-500">No radar data available for this player/season</p> </div> </div> );

  const primaryData = METRICS_CONFIG.map(m => { const found = radarData.find((r: any) => r.key === m.key); return { metric: m.label, value: found ? Math.min(100, found.percentile) : 0, rawValue: found ? found.value : 0, fullMark: m.max }; });
  const secondaryData = compareData ? METRICS_CONFIG.map(m => { const found = compareData.find((r: any) => r.key === m.key); return { metric: m.label, value: found ? Math.min(100, found.percentile) : 0, rawValue: found ? found.value : 0, fullMark: m.max }; }) : [];

  const chartData = [ { ...primaryData.reduce((acc, d) => ({ ...acc, [d.metric]: d.value }), {}), name: 'Player' }, ...(secondaryData.length ? [{ ...secondaryData.reduce((acc, d) => ({ ...acc, [d.metric]: d.value }), {}), name: 'Comparison' }] : []) ];

  return (
    <div className={className} style={{ height: 450 }}>
      <RadarChart width={500} height={450} data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <PolarGrid gridType="polygon" />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} ticks={[20, 40, 60, 80, 100] as any} />
        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(value: number, name: string) => { const metric = METRICS_CONFIG.find(m => m.label === name); if (!metric) return [value, name]; const raw = primaryData.find(d => d.metric === name)?.rawValue; return [`${value}% (${raw} raw)`, name]; }} labelFormatter={(_, payload) => payload[0]?.payload?.metric || ''} />
        <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
        <Radar name="Player" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} dot={false} />
        {secondaryData.length && ( <Radar name="Comparison" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" dot={false} /> )}
      </RadarChart>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
        {primaryData.map(d => ( <div key={d.metric} className="bg-white rounded-lg border border-slate-200 p-3"> <p className="font-medium text-slate-600 truncate">{d.metric}</p> <div className="flex items-center justify-between mt-1"> <span className="text-2xl font-bold text-primary-600">{d.value}%</span> <span className="text-xs text-slate-400">{d.rawValue} / {d.fullMark}</span> </div> </div> ))}
      </div>
    </div>
  );
}