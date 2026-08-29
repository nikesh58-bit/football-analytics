'use client';

import { useLiveMatches } from '@/hooks/useApi';
import Link from 'next/link';
import { format } from 'date-fns';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

const STATUS_COLORS = { LIVE: 'bg-red-500', HT: 'bg-orange-500', FT: 'bg-green-500', SCHEDULED: 'bg-slate-400', POSTPONED: 'bg-slate-500', CANCELLED: 'bg-red-500' } as const;

export function LiveMatches() {
  const { data: matches, isLoading } = useLiveMatches();

  if (isLoading) return ( <section aria-label="Live matches loading"> <h2 className="text-xl font-semibold text-slate-900 mb-4">Live Matches</h2> <div className="space-y-3"> {[...Array(3)].map((_, i) => ( <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse flex items-center gap-4"> <div className="w-10 h-10 bg-slate-200 rounded-full skeleton" /> <div className="flex-1"><div className="h-4 bg-slate-200 rounded skeleton-text" /></div> <div className="w-20 h-8 bg-slate-200 rounded skeleton" /> <div className="flex-1"><div className="h-4 bg-slate-200 rounded skeleton-text" /></div> <div className="w-10 h-10 bg-slate-200 rounded-full skeleton" /> </div> ))} </div> </section> );

  if (!matches?.length) return ( <section className="text-center py-8"> <p className="text-slate-500">No live matches at the moment</p> </section> );

  return ( <section aria-label="Live Matches"> <div className="flex items-center justify-between mb-4"> <h2 className="text-xl font-semibold text-slate-900">Live Now</h2> <Link href="/matches?status=LIVE" className="text-sm text-primary-600 hover:underline font-medium">View all →</Link> </div> <div className="space-y-3"> {matches.slice(0, 5).map((match: any) => ( <Link key={match.id} href={`/matches/${match.id}`} className="group block bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-lg transition-all duration-200"> <div className="flex items-center justify-between gap-4"> <div className="flex-1 text-right pr-4"> <p className="font-medium text-slate-900">{match.homeTeam?.name}</p> <p className="text-xs text-slate-500">{match.homeTeam?.shortName}</p> </div> <div className="flex flex-col items-center gap-1 min-w-[100px]"> <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[match.status as keyof typeof STATUS_COLORS] || 'bg-slate-400'} text-white`}> {match.status === 'LIVE' ? `${match.minute || 0}'` : match.status === 'HT' ? 'HT' : match.status === 'FT' ? 'FT' : match.status === 'SCHEDULED' ? format(new Date(match.kickoffTime), 'HH:mm') : match.status } </span> </div> <div className="w-16 text-center"> <span className="text-2xl font-bold text-slate-900"> {match.homeScore !== null && match.awayScore !== null ? `${match.homeScore} - ${match.awayScore}` : 'vs'} </span> </div> <div className="flex-1 text-left pl-4"> <p className="font-medium text-slate-900">{match.awayTeam?.name}</p> <p className="text-xs text-slate-500">{match.awayTeam?.shortName}</p> </div> </div> {match.events?.length && ( <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2"> {match.events.slice(0, 3).map((event: any) => ( <span key={event.id} className="text-xs px-2 py-0.5 bg-slate-50 rounded text-slate-600"> {event.minute}' {event.type} {event.player?.displayName} </span> ))} </div> )} </Link> ))} </div> </section> );
}