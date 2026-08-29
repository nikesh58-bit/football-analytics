'use client';

import { useState } from 'react';
import { usePlayers } from '@/hooks/useApi';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Search, Filter, ChevronDown, Trophy, Target, Users } from 'lucide-react';
import Link from 'next/link';

export default function PlayersPage() {
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');
  const [team, setTeam] = useState('');
  const [nationality, setNationality] = useState('');
  const [minMinutes, setMinMinutes] = useState(0);
  const [sortBy, setSortBy] = useState('goals');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const { data, isLoading } = usePlayers({ search, position, teamId: team, nationality, minMinutes: minMinutes.toString(), sortBy, sortOrder, limit: '50' });

  const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'];
  const nationalities = ['England', 'Spain', 'Germany', 'France', 'Italy', 'Brazil', 'Argentina', 'Portugal', 'Netherlands', 'Belgium'];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">All Players</h1>
          <p className="text-slate-600">Browse player statistics across all competitions</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <select value={position} onChange={e => setPosition(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
              <option value="">All Positions</option>
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={nationality} onChange={e => setNationality(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
              <option value="">All Nationalities</option>
              {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <input type="number" value={minMinutes} onChange={e => setMinMinutes(parseInt(e.target.value) || 0)} placeholder="Min minutes" className="w-32 px-4 py-2 border border-slate-200 rounded-lg" min="0" />
          </div>
          <div className="flex items-center gap-4">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-1 border border-slate-200 rounded-lg text-sm">
              <option value="goals">Goals</option>
              <option value="assists">Assists</option>
              <option value="xG">xG</option>
              <option value="xA">xA</option>
              <option value="minutesPlayed">Minutes</option>
              <option value="appearances">Appearances</option>
            </select>
            <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="px-3 py-1 border border-slate-200 rounded-lg text-sm"> {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'} </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <TableSkeleton />
          ) : data?.data?.length ? (
            <>
              <TableHeader sortBy={sortBy} sortOrder={sortOrder} onSortChange={setSortBy} />
              <tbody className="divide-y divide-slate-100">
                {data.data.map((player: any, index: number) => (
                  <tr key={player.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-600">
                      {((data?.page || 1) - 1) * (data?.pageSize || 20) + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/players/${player.id}`} className="flex items-center gap-3">
                        {player.photoUrl && <img src={player.photoUrl} alt="" className="w-8 h-8 rounded-full" />}
                        <div>
                          <p className="font-medium text-slate-900 hover:text-primary-600 transition-colors">{player.displayName}</p>
                          <p className="text-xs text-slate-500">{player.nationality} • {player.position}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {player.currentTeam?.crestUrl && ( <img src={player.currentTeam.crestUrl} alt="" className="w-6 h-6 inline mr-1" /> )}
                      <span className="text-sm text-slate-600">{player.currentTeam?.shortName}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-slate-900">{player.seasonStats?.[0]?.goals || 0}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{player.seasonStats?.[0]?.assists || 0}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{player.seasonStats?.[0]?.xG?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{player.seasonStats?.[0]?.xA?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{player.seasonStats?.[0]?.shots || 0}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{player.seasonStats?.[0]?.shotsOnTarget || 0}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{player.seasonStats?.[0]?.keyPasses || 0}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{player.seasonStats?.[0]?.dribblesWon || 0}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{player.seasonStats?.[0]?.passAccuracy?.toFixed(1) || '0.0'}%</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{player.seasonStats?.[0]?.minutesPlayed || 0}</td>
                  </tr>
                ))}
              </tbody>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500">No players found matching your criteria</div>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Previous</button>
            <span className="px-4 py-2 text-slate-600">Page {data.page} of {data.totalPages}</span>
            <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Next</button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function TableHeader({ sortBy, sortOrder, onSortChange }: { sortBy: string; sortOrder: string; onSortChange: (v: string) => void }) {
  const columns = [ { key: '#', width: 'w-12' }, { key: 'Player', width: 'w-1/4 min-w-[200px]' }, { key: 'Club', width: 'w-24' }, { key: 'G', sortable: 'goals', width: 'w-16' }, { key: 'A', sortable: 'assists', width: 'w-16' }, { key: 'xG', sortable: 'xG', width: 'w-16' }, { key: 'xA', sortable: 'xA', width: 'w-16' }, { key: 'Shots', sortable: 'shots', width: 'w-16' }, { key: 'SoT', sortable: 'shotsOnTarget', width: 'w-16' }, { key: 'KP', sortable: 'keyPasses', width: 'w-16' }, { key: 'Drb', sortable: 'dribblesWon', width: 'w-16' }, { key: 'Pass%', sortable: 'passAccuracy', width: 'w-20' }, { key: 'Min', sortable: 'minutesPlayed', width: 'w-20' }, ];
  return ( <thead> <tr className="bg-slate-50 border-b border-slate-200"> {columns.map(col => ( <th key={col.key} className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider ${col.width} ${col.sortable ? 'cursor-pointer hover:text-primary-600 select-none' : ''}`}> <button onClick={() => col.sortable && onSortChange(col.sortable)} className="flex items-center gap-1"> {col.key} {col.sortable && sortBy === col.sortable && (sortOrder === 'asc' ? ' ↑' : ' ↓')} </button> </th> ))} </tr> </thead> );
}

function TableSkeleton() {
  return ( <div className="animate-pulse"> <TableHeader sortBy="goals" sortOrder="desc" onSortChange={() => {}} /> <tbody className="divide-y divide-slate-100"> {[...Array(10)].map((_, i) => ( <tr key={i}> <td className="px-4 py-3"><div className="h-4 w-8 bg-slate-200 rounded" /></td> <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-200 rounded-full" /><div className="flex-1 space-y-1"><div className="h-4 w-32 bg-slate-200 rounded" /><div className="h-3 w-24 bg-slate-200 rounded" /></div></div></td> <td className="px-4 py-3"><div className="w-6 h-6 bg-slate-200 rounded mx-auto" /></td> {[...Array(10)].map((_, j) => <td key={j} className="px-4 py-3 text-center"><div className="h-4 w-8 bg-slate-200 rounded mx-auto" /></td>)} </tr> ))} </tbody> </div> );
}