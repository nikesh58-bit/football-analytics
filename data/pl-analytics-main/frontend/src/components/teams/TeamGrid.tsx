'use client';

import { useTeams } from '@/hooks/useApi';
import Link from 'next/link';
import { Trophy, Users, Target } from 'lucide-react';

export function TeamGrid() {
  const { data, error, isLoading } = useTeams({ competitionId: 'premier-league', limit: '20' });

  if (isLoading) return ( <section aria-label="Teams loading"> <h2 className="text-xl font-semibold text-slate-900 mb-4">Premier League Teams</h2> <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> {[...Array(8)].map((_, i) => ( <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse"> <div className="h-12 w-12 mx-auto mb-3 bg-slate-200 rounded-full skeleton" /> <div className="h-4 w-3/4 mx-auto mb-2 bg-slate-200 rounded skeleton-text" /> <div className="h-3 w-1/2 mx-auto bg-slate-200 rounded skeleton-text short" /> </div> ))} </div> </section> );

  if (error || !data?.data?.length) return ( <section className="text-center py-8"> <p className="text-slate-500">No teams found</p> </section> );

  const teams = data.data.slice(0, 12);

  return ( <section aria-label="Premier League Teams"> <div className="flex items-center justify-between mb-4"> <h2 className="text-xl font-semibold text-slate-900">Premier League Teams</h2> <Link href="/teams" className="text-sm text-primary-600 hover:underline font-medium">View all →</Link> </div> <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> {teams.map((team: any) => ( <Link key={team.id} href={`/teams/${team.id}`} className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-lg transition-all duration-200"> <div className="flex items-center justify-center gap-3 mb-3"> {team.crestUrl && ( <img src={team.crestUrl} alt={`${team.name} crest`} className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" /> )} <div className="text-center"> <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">{team.name}</h3> <p className="text-xs text-slate-500">{team.shortName}</p> </div> </div> <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-slate-100"> <div> <Trophy className="w-4 h-4 mx-auto text-slate-400 mb-1" /> <span className="font-medium text-slate-700">{team._count?.homeMatches + team._count?.awayMatches || 0}</span> <p className="text-slate-400">Matches</p> </div> <div> <Users className="w-4 h-4 mx-auto text-slate-400 mb-1" /> <span className="font-medium text-slate-700">{team._count?.players || 0}</span> <p className="text-slate-400">Players</p> </div> <div> <Target className="w-4 h-4 mx-auto text-slate-400 mb-1" /> <span className="font-medium text-slate-700">—</span> <p className="text-slate-400">Titles</p> </div> </div> </Link> ))} </div> </section> );
}