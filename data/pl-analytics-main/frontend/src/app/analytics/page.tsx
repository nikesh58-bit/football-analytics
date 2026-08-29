'use client';

import { useState } from 'react';
import { useLeagueTable, useTopScorers, useTopAssists, useTeams } from '@/hooks/useApi';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Trophy, Target, Award, TrendingUp, BarChart2, Users } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const [seasonId, setSeasonId] = useState('current-season-id');
  const [activeTab, setActiveTab] = useState<'standings' | 'topscorers' | 'topassists' | 'comparison'>('standings');
  const [compareTeams, setCompareTeams] = useState<string[]>([]);

  const { data: table } = useLeagueTable(seasonId);
  const { data: scorers } = useTopScorers(seasonId, undefined, 20);
  const { data: assists } = useTopAssists(seasonId, undefined, 20);
  const { data: teams } = useTeams({ limit: '50' });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics</h1>
          <p className="text-slate-600">League tables, top performers, and team comparisons</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700">Season:</label>
            <select value={seasonId} onChange={e => setSeasonId(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
              <option value="current-season-id">2023/24 Premier League</option>
              <option value="prev-season-id">2022/23 Premier League</option>
            </select>
            <label className="text-sm font-medium text-slate-700">Competition:</label>
            <select className="px-4 py-2 border border-slate-200 rounded-lg">
              <option value="premier-league">Premier League</option>
              <option value="la-liga">La Liga</option>
              <option value="bundesliga">Bundesliga</option>
              <option value="serie-a">Serie A</option>
              <option value="ligue-1">Ligue 1</option>
            </select>
          </div>
        </div>

        <div className="border-b border-slate-200 mb-6">
          <nav className="flex gap-8" aria-label="Analytics tabs">
            <button onClick={() => setActiveTab('standings')} className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'standings' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> <BarChart2 className="w-4 h-4 inline mr-1" /> League Table </button>
            <button onClick={() => setActiveTab('topscorers')} className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'topscorers' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> <Trophy className="w-4 h-4 inline mr-1" /> Top Scorers </button>
            <button onClick={() => setActiveTab('topassists')} className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'topassists' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> <Target className="w-4 h-4 inline mr-1" /> Top Assists </button>
            <button onClick={() => setActiveTab('comparison')} className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'comparison' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> <Users className="w-4 h-4 inline mr-1" /> Compare Teams </button>
          </nav>
        </div>

        {activeTab === 'standings' && <LeagueTable table={table} />}
        {activeTab === 'topscorers' && <TopScorersTable scorers={scorers} />}
        {activeTab === 'topassists' && <TopAssistsTable assists={assists} />}
        {activeTab === 'comparison' && <TeamComparison teams={teams?.data || []} selectedTeams={compareTeams} onSelectionChange={setCompareTeams} />}
      </main>
      <Footer />
    </div>
  );
}

function LeagueTable({ table }: { table: any[] }) {
  if (!table?.length) return <div className="text-center py-8 text-slate-500">No table data available</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">Pos</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Team</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">Pld</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">W</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">D</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">L</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">GF</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">GA</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">GD</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">xG</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">xGA</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">Pts</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">Form</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {table.map((team: any) => (
            <tr key={team.id} className={`hover:bg-slate-50 ${team.position <= 4 ? 'bg-blue-50' : team.position >= 18 ? 'bg-red-50' : ''}`}>
              <td className="px-4 py-3 font-bold text-slate-900">{team.position}</td>
              <td className="px-4 py-3"> <Link href={`/teams/${team.team.id}`} className="flex items-center gap-3"> {team.team.crestUrl && <img src={team.team.crestUrl} alt="" className="w-8 h-8" />} <span className="font-medium text-slate-900">{team.team.name}</span> </Link> </td>
              <td className="px-4 py-3 text-center text-sm text-slate-600">{team.played}</td>
              <td className="px-4 py-3 text-center text-sm text-green-600 font-medium">{team.won}</td>
              <td className="px-4 py-3 text-center text-sm text-amber-600 font-medium">{team.drawn}</td>
              <td className="px-4 py-3 text-center text-sm text-red-600 font-medium">{team.lost}</td>
              <td className="px-4 py-3 text-center text-sm text-slate-600">{team.goalsFor}</td>
              <td className="px-4 py-3 text-center text-sm text-slate-600">{team.goalsAgainst}</td>
              <td className="px-4 py-3 text-center text-sm font-medium text-slate-900">{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
              <td className="px-4 py-3 text-center text-sm text-blue-600">{team.xGFor?.toFixed(1)}</td>
              <td className="px-4 py-3 text-center text-sm text-red-600">{team.xGAgainst?.toFixed(1)}</td>
              <td className="px-4 py-3 text-center text-sm font-bold text-slate-900">{team.points}</td>
              <td className="px-4 py-3 text-center"> <div className="flex items-center justify-center gap-1"> {team.form?.split('').map((r: string, i: number) => ( <span key={i} className={`w-5 h-5 text-xs font-medium rounded ${ r === 'W' ? 'bg-green-100 text-green-700' : r === 'D' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700' }`}>{r}</span> ))} </div> </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopScorersTable({ scorers }: { scorers: any[] }) {
  if (!scorers?.length) return <div className="text-center py-8 text-slate-500">No scorer data available</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Player</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">Club</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16"><Trophy className="w-4 h-4 mx-auto" /></th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16"><Target className="w-4 h-4 mx-auto" /></th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">Apps</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">Min</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">xG</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">G p90</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {scorers.map((scorer: any, index: number) => (
            <tr key={scorer.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-bold text-slate-600">{index + 1}</td>
              <td className="px-4 py-3"> <Link href={`/players/${scorer.player.id}`} className="flex items-center gap-3"> {scorer.player.photoUrl && <img src={scorer.player.photoUrl} alt="" className="w-8 h-8 rounded-full" />} <div> <p className="font-medium text-slate-900">{scorer.player.displayName}</p> <p className="text-xs text-slate-500">{scorer.player.nationality}</p> </div> </Link> </td>
              <td className="px-4 py-3 text-center"> {scorer.team.crestUrl && <img src={scorer.team.crestUrl} alt="" className="w-6 h-6 mx-auto" />} <span className="text-sm text-slate-600">{scorer.team.shortName}</span> </td>
              <td className="px-4 py-3 text-center font-bold text-slate-900 text-lg">{scorer.goals}</td>
              <td className="px-4 py-3 text-center text-sm text-slate-600">{scorer.assists}</td>
              <td className="px-4 py-3 text-center text-sm text-slate-600">{scorer.appearances}</td>
              <td className="px-4 py-3 text-center text-sm text-slate-600">{scorer.minutesPlayed}</td>
              <td className="px-4 py-3 text-center text-sm text-slate-600">{scorer.xG?.toFixed(2)}</td>
              <td className="px-4 py-3 text-center text-sm font-medium text-primary-600"> {scorer.minutesPlayed > 0 ? ((scorer.goals / scorer.minutesPlayed) * 90).toFixed(2) : '0.00'} </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopAssistsTable({ assists }: { assists: any[] }) {
  if (!assists?.length) return <div className="text-center py-8 text-slate-500">No assist data available</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Player</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">Club</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16"><Trophy className="w-4 h-4 mx-auto" /></th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16"><Target className="w-4 h-4 mx-auto" /></th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">Apps</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">Min</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">xA</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">A p90</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {assists.map((assister: any, index: number) => (
            <tr key={assister.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-bold text-slate-600">{index + 1}</td>
              <td className="px-4 py-3"> <Link href={`/players/${assister.player.id}`} className="flex items-center gap-3"> {assister.player.photoUrl && <img src={assister.player.photoUrl} alt="" className="w-8 h-8 rounded-full" />} <div> <p className="font-medium text-slate-900">{assister.player.displayName}</p> <p className="text-xs text-slate-500">{assister.player.nationality}</p> </div> </Link> </td>
              <td className="px-4 py-3 text-center"> {assister.team.crestUrl && <img src={assister.team.crestUrl} alt="" className="w-6 h-6 mx-auto" />} <span className="text-sm text-slate-600">{assister.team.shortName}</span> </td>
              <td className="px-4 py-3 text-center font-bold text-slate-900 text-lg">{assister.goals}</td>
              <td className="px-4 py-3 text-center text-sm text-slate-600">{assister.assists}</td>
              <td className="px-4 py-3 text-center text-sm text-slate-600">{assister.appearances}</td>
              <td className="px-4 py-3 text-center text-sm text-slate-600">{assister.minutesPlayed}</td>
              <td className="px-4 py-3 text-center text-sm text-slate-600">{assister.xA?.toFixed(2)}</td>
              <td className="px-4 py-3 text-center text-sm font-medium text-primary-600"> {assister.minutesPlayed > 0 ? ((assister.assists / assister.minutesPlayed) * 90).toFixed(2) : '0.00'} </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamComparison({ teams, selectedTeams, onSelectionChange }: { teams: any[]; selectedTeams: string[]; onSelectionChange: (ids: string[]) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Teams to Compare</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {teams.map(team => (
            <label key={team.id} className={`relative cursor-pointer p-3 border-2 rounded-xl transition-colors ${selectedTeams.includes(team.id) ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-300'}`}>
              <input type="checkbox" value={team.id} checked={selectedTeams.includes(team.id)} onChange={e => { if (e.target.checked) onSelectionChange([...selectedTeams, team.id]); else onSelectionChange(selectedTeams.filter(id => id !== team.id)); }} className="sr-only" />
              {team.crestUrl && <img src={team.crestUrl} alt="" className="w-10 h-10 mx-auto mb-2" />}
              <p className="text-sm font-medium text-center">{team.shortName}</p>
            </label>
          ))}
        </div>
        {selectedTeams.length >= 2 && (
          <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <p className="text-sm text-primary-800 mb-2">Selected: {selectedTeams.length} teams</p>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"> Generate Comparison </button>
          </div>
        )}
      </div>

      {selectedTeams.length >= 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Comparison Preview</h3>
          <p className="text-slate-500">Select teams above to see detailed comparison across metrics like xG, possession, defensive actions, etc.</p>
        </div>
      )}
    </div>
  );
}