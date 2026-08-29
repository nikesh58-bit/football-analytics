'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { useShots } from '@/hooks/useApi';
import { X, Circle, Flag, HelpCircle } from 'lucide-react';

interface Shot {
  id: string;
  player: { displayName: string; photoUrl?: string };
  team: { name: string; shortName: string; crestUrl?: string; id: string };
  match: { id: string; homeTeam: { id: string; name: string }; awayTeam: { id: string; name: string }; homeScore?: number; awayScore?: number };
  minute: number;
  second: number;
  type: string;
  x: number | null;
  y: number | null;
  endX: number | null;
  endY: number | null;
  bodyPart: string | null;
  situation: string | null;
  outcome: string | null;
  isGoal: boolean;
  xG: number;
}

interface ShotMapProps {
  matchId?: string;
  playerId?: string;
  teamId?: string;
  seasonId?: string;
  competitionId?: string;
  className?: string;
}

const PITCH_WIDTH = 105;
const PITCH_HEIGHT = 68;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = CANVAS_WIDTH * (PITCH_HEIGHT / PITCH_WIDTH);

export function ShotMap({ matchId, playerId, teamId, seasonId, competitionId, className }: ShotMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [filter, setFilter] = useState<'all' | 'goals' | 'shots' | 'on_target'>('all');
  const [showXG, setShowXG] = useState(true);

  const { data: shots, isLoading, error } = useShots({
    matchId,
    playerId,
    teamId,
    seasonId,
    competitionId,
    limit: '500',
  });

  const filteredShots = useMemo(() => {
    if (!shots) return [];
    return shots.filter((shot: Shot) => {
      if (filter === 'goals') return shot.isGoal;
      if (filter === 'on_target') return shot.type === 'SHOT_ON_TARGET' || shot.isGoal;
      if (filter === 'shots') return !shot.isGoal && shot.type !== 'SHOT_ON_TARGET';
      return true;
    });
  }, [shots, filter]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const padding = 40;
    const pitchW = CANVAS_WIDTH - padding * 2;
    const pitchH = CANVAS_HEIGHT - padding * 2;
    const scaleX = pitchW / PITCH_WIDTH;
    const scaleY = pitchH / PITCH_HEIGHT;

    const toCanvas = (x: number, y: number) => ({
      x: padding + x * scaleX,
      y: padding + (PITCH_HEIGHT - y) * scaleY,
    });

    ctx.fillStyle = '#1a5c2e';
    ctx.fillRect(padding, padding, pitchW, pitchH);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, pitchW, pitchH);

    ctx.beginPath();
    ctx.moveTo(padding + pitchW / 2, padding);
    ctx.lineTo(padding + pitchW / 2, padding + pitchH);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(padding + pitchW / 2, padding + pitchH / 2, 9.15 * scaleX, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(padding + pitchW / 2, padding + pitchH / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    const boxW = 16.5 * scaleX;
    const boxH = 40.3 * scaleY;
    const boxY = (pitchH - boxH) / 2;
    ctx.strokeRect(padding, padding + boxY, boxW, boxH);
    ctx.strokeRect(padding + pitchW - boxW, padding + boxY, boxW, boxH);

    const sixW = 5.5 * scaleX;
    const sixH = 18.3 * scaleY;
    const sixY = (pitchH - sixH) / 2;
    ctx.strokeRect(padding, padding + sixY, sixW, sixH);
    ctx.strokeRect(padding + pitchW - sixW, padding + sixY, sixW, sixH);

    const penSpotDist = 11 * scaleX;
    ctx.beginPath();
    ctx.arc(padding + penSpotDist, padding + pitchH / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(padding + pitchW - penSpotDist, padding + pitchH / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    const arcRadius = 9.15 * scaleX;
    ctx.beginPath();
    ctx.arc(padding + penSpotDist, padding + pitchH / 2, arcRadius, -0.5 * Math.PI, 0.5 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(padding + pitchW - penSpotDist, padding + pitchH / 2, arcRadius, 0.5 * Math.PI, 1.5 * Math.PI);
    ctx.stroke();

    const cornerR = 1 * scaleX;
    [padding, padding + pitchW].forEach(cx => {
      [padding, padding + pitchH].forEach(cy => {
        ctx.beginPath();
        ctx.arc(cx, cy, cornerR, 0, Math.PI / 2);
        ctx.stroke();
      });
    });

    filteredShots.forEach((shot: Shot) => {
      if (shot.x === null || shot.y === null) return;
      const pos = toCanvas(shot.x, shot.y);
      const isHomeTeam = shot.team.id === shot.match?.homeTeam?.id;
      const isGoal = shot.isGoal;
      const isOnTarget = shot.type === 'SHOT_ON_TARGET' || isGoal;

      const radius = Math.max(6, Math.min(18, 6 + (shot.xG || 0) * 15));

      ctx.fillStyle = isHomeTeam ? 'rgba(59, 130, 246, 0.85)' : 'rgba(239, 68, 68, 0.85)';
      ctx.strokeStyle = isHomeTeam ? '#1d4ed8' : '#b91c1c';
      ctx.lineWidth = isGoal ? 3 : 1.5;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (isGoal) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (showXG && shot.xG > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(shot.xG.toFixed(2), pos.x, pos.y - radius - 4);
      }

      if (shot.endX !== null && shot.endY !== null) {
        const endPos = toCanvas(shot.endX, shot.endY);
        ctx.strokeStyle = isHomeTeam ? 'rgba(59, 130, 246, 0.6)' : 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(endPos.x, endPos.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const angle = Math.atan2(endPos.y - pos.y, endPos.x - pos.x);
        const headLen = 8;
        ctx.beginPath();
        ctx.moveTo(endPos.x, endPos.y);
        ctx.lineTo(endPos.x - headLen * Math.cos(angle - Math.PI / 6), endPos.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endPos.x - headLen * Math.cos(angle + Math.PI / 6), endPos.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }
    });
  }, [filteredShots, filter, showXG, matchId]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!shots) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const padding = 40;
    const pitchW = CANVAS_WIDTH - padding * 2;
    const pitchH = CANVAS_HEIGHT - padding * 2;
    const scaleX = pitchW / PITCH_WIDTH;
    const scaleY = pitchH / PITCH_HEIGHT;

    const clickX = (e.clientX - rect.left) * dpr;
    const clickY = (e.clientY - rect.top) * dpr;

    const pitchX = (clickX - padding) / scaleX;
    const pitchY = PITCH_HEIGHT - (clickY - padding) / scaleY;

    let closest: Shot | null = null;
    let minDist = Infinity;

    filteredShots.forEach((shot: Shot) => {
      if (shot.x === null || shot.y === null) return;
      const dist = Math.hypot(shot.x - pitchX, shot.y - pitchY);
      if (dist < minDist && dist < 3) { minDist = dist; closest = shot; }
    });

    if (closest) setSelectedShot(closest);
  };

  if (isLoading) return ( <div className={className} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}> <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" /> <div className="absolute inset-0 flex items-center justify-center bg-slate-50"> <div className="animate-pulse text-slate-400">Loading shot map...</div> </div> </div> );

  if (error || !shots?.length) return ( <div className={className} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}> <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200"> <p className="text-slate-500">No shot data available</p> </div> </div> );

  return (
    <div className={`${className} relative`} style={{ width: CANVAS_WIDTH, maxWidth: '100%' }}>
      <canvas ref={canvasRef} onClick={handleClick} className="w-full h-auto border border-slate-200 rounded-xl bg-slate-100" role="img" aria-label={`Shot map showing ${filteredShots.length} shots`} />
      <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 justify-between">
        <div className="flex gap-1 bg-white/90 backdrop-blur rounded-lg p-1 shadow-lg">
          {['all', 'goals', 'on_target', 'shots'].map(f => ( <button key={f} onClick={() => setFilter(f as any)} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}> {f === 'all' ? 'All' : f === 'goals' ? 'Goals' : f === 'on_target' ? 'On Target' : 'Shots'} </button> ))} </div>
        <label className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-lg px-3 py-1 shadow-lg text-sm"> <input type="checkbox" checked={showXG} onChange={e => setShowXG(e.target.checked)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" /> Show xG </label>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-4 justify-center bg-white/90 backdrop-blur rounded-lg p-2 shadow-lg text-xs">
        <div className="flex items-center gap-2"> <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-700" /> <span className="text-slate-600">Home Team</span> </div>
        <div className="flex items-center gap-2"> <div className="w-3 h-3 rounded-full bg-red-500 border border-red-700" /> <span className="text-slate-600">Away Team</span> </div>
        <div className="flex items-center gap-2"> <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500" /> <span className="text-slate-600">Goal</span> </div>
        <div className="flex items-center gap-2"> <svg className="w-4 h-4 text-slate-400" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="4,4"/></svg> <span className="text-slate-600">Shot Direction</span> </div>
      </div>
      {selectedShot && (
        <div className="absolute bottom-20 left-3 right-3 max-w-md mx-auto bg-white rounded-xl shadow-xl border border-slate-200 p-4 animate-fade-in z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {selectedShot.player.photoUrl && ( <img src={selectedShot.player.photoUrl} alt="" className="w-8 h-8 rounded-full" /> )}
                <div> <p className="font-semibold text-slate-900">{selectedShot.player.displayName}</p> <p className="text-xs text-slate-500">{selectedShot.team.shortName} • {selectedShot.minute}'+{selectedShot.second.toString().padStart(2, '0')}</p> </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded bg-${selectedShot.isGoal ? 'amber-100 text-amber-800' : 'blue-100 text-blue-800'}`}> {selectedShot.isGoal ? 'GOAL' : selectedShot.type.replace('_', ' ')} </span>
                {selectedShot.bodyPart && ( <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{selectedShot.bodyPart}</span> )}
                {selectedShot.situation && ( <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{selectedShot.situation.replace('_', ' ')}</span> )}
              </div>
            </div>
            <button onClick={() => setSelectedShot(null)} className="text-slate-400 hover:text-slate-600 p-1"> <X className="w-5 h-5" /> </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100">
            <div className="text-center"> <p className="text-2xl font-bold text-primary-600">{selectedShot.xG.toFixed(2)}</p> <p className="text-xs text-slate-500">xG</p> </div>
            <div className="text-center"> <p className="text-2xl font-bold text-slate-900">{selectedShot.outcome === 'SUCCESS' ? 'On Target' : 'Off Target'}</p> <p className="text-xs text-slate-500">Outcome</p> </div>
            <div className="text-center"> <p className="text-2xl font-bold text-slate-900">{selectedShot.minute}'</p> <p className="text-xs text-slate-500">Minute</p> </div>
          </div>
          {selectedShot.endX !== null && selectedShot.endY !== null && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-center text-xs text-slate-500"> Shot direction: ({selectedShot.x?.toFixed(1)}, {selectedShot.y?.toFixed(1)}) → ({selectedShot.endX.toFixed(1)}, {selectedShot.endY.toFixed(1)}) </div>
          )}
        </div>
      )}
    </div>
  );
}