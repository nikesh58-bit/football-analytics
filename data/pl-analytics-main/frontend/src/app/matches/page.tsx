'use client';

import { useState } from 'react';
import { useMatches, useLiveMatches, useUpcomingMatches } from '@/hooks/useApi';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Calendar, Clock, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const STATUS_COLORS = { LIVE: 'bg-red-500', HT: 'bg-orange-500', FT: 'bg-green-500', SCHEDULED: 'bg-slate-400', POSTPONED: 'bg-slate-500', CANCELLED: 'bg-red-500' } as const;

export default function MatchesPage() {
  const [status, setStatus] = useState('');
  const [competition, setCompetition] = useState('');
  const [team, setTeam] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const { data: matches, isLoading } = useMatches({ status, competitionId: competition, teamId: team, fromDate: dateFrom, toDate: dateTo, limit: '50' });
  const { data: liveMatches } = useLiveMatches();
  const { data: upcomingMatches } = useUpcomingMatches(5);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">All Matches</h1>
          <p className="text-slate-600">Browse fixtures, results, and live matches</p>
        </div>

        {liveMatches?.length && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 text-red-700 font-semibold"> <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Live Now </h2>
              <Link href="/matches?status=LIVE" className="text-sm text-red-600 hover:underline">View all live →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveMatches.slice(0, 3).map((match: any) => (
                <Link key={match.id} href={`/matches/${match.id}`} className="bg-white rounded-lg border border-red-200 p-3 hover:border-red-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"> {match.homeTeam.crestUrl && <img src={match.homeTeam.crestUrl} alt="" className="w-8 h-8" />} <span className="text-sm font-medium">{match.homeTeam.shortName}</span> </div>
                    <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded">{match.minute}'</span>
                    <div className="flex items-center gap-2"> <span className="text-lg font-bold text-slate-900">{match.homeScore} - {match.awayScore}</span> </div>
                    <div className="flex items-center gap-2"> <span className="text-sm font-medium">{match.awayTeam.shortName}</span> {match.awayTeam.crestUrl && <img src={match.awayTeam.crestUrl} alt="" className="w-8 h-8" />} </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {upcomingMatches?.length && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 text-blue-700 font-semibold"> <Calendar className="w-4 h-4" /> Upcoming </h2>
              <Link href="/matches?status=SCHEDULED" className="text-sm text-blue-600 hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingMatches.slice(0, 3).map((match: any) => (
                <Link key={match.id} href={`/matches/${match.id}`} className="bg-white rounded-lg border border-blue-200 p-3 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"> {match.homeTeam.crestUrl && <img src={match.homeTeam.crestUrl} alt="" className="w-8 h-8" />} <span className="text-sm font-medium">{match.homeTeam.shortName}</span> </div>
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">{format(new Date(match.kickoffTime), 'HH:mm')}</span>
                    <div className="flex items-center gap-2"> <span className="text-lg font-bold text-slate-400">vs</span> </div>
                    <div className="flex items-center gap-2"> <span className="text-sm font-medium">{match.awayTeam.shortName}</span> {match.awayTeam.crestUrl && <img src={match.awayTeam.crestUrl} alt="" className="w-8 h-8" />} </div>
                  </div>
                  <div className="mt-2 text-center text-xs text-slate-500"> {format(new Date(match.kickoffTime), 'MMM d, yyyy')} • {match.season?.competition?.shortName} </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1"> <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full pl-4 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" /> </div>
            <div className="relative flex-1"> <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full pl-4 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" /> </div>
            <select value={status} onChange={e => setStatus(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
              <option value="">All Status</option>
              <option value="LIVE">Live</option>
              <option value="FT">Finished</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="POSTPONED">Postponed</option>
            </select>
            <select value={competition} onChange={e => setCompetition(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
              <option value="">All Competitions</option>
              <option value="premier-league">Premier League</option>
              <option value="champions-league">Champions League</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => ( <MatchCardSkeleton key={i} /> ))
          ) : matches?.data?.length ? (
            matches.data.map((match: any) => ( <Link key={match.id} href={`/matches/${match.id}`} className="block"> <MatchCard match={match} /> </Link> ))
          ) : (
            <div className="text-center py-16"> <p className="text-slate-500">No matches found</p> </div>
          )}

          {matches && matches.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Previous</button>
              <span className="px-4 py-2 text-slate-600">Page {matches.page} of {matches.totalPages}</span>
              <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Next</button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function MatchCard({ match }: { match: any }) {
  const isLive = match.status === 'LIVE' || match.status === 'HT';
  const isFinished = ['FT', 'AET', 'PEN'].includes(match.status);
  const homeScore = match.homeScore ?? null;
  const awayScore = match.awayScore ?? null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[match.status as keyof typeof STATUS_COLORS] || 'bg-slate-400'} text-white`}> {match.status === 'LIVE' ? `${match.minute || 0}'` : match.status === 'HT' ? 'HT' : match.status === 'FT' ? 'FT' : match.status} </span>
          {match.season?.competition && ( <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">{match.season.competition.shortName}</span> )}
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">{format(new Date(match.kickoffTime), 'MMM d, HH:mm')}</span>
      </div>

      <div className="flex items-center justify-between gap-4 mt-4">
        <div className="flex flex-col items-center text-center flex-1">
          {match.homeTeam.crestUrl && <img src={match.homeTeam.crestUrl} alt="" className="w-10 h-10 mb-1" />}
          <p className="font-medium text-slate-900 text-sm">{match.homeTeam.name}</p>
          <p className="text-xs text-slate-500">{match.homeTeam.shortName}</p>
        </div>

        <div className="flex flex-col items-center gap-1 min-w-[100px]">
          <div className="text-xl font-bold text-slate-900 tabular-nums"> {homeScore !== null && awayScore !== null ? `${homeScore} - ${awayScore}` : 'vs'} </div>
          {isFinished && match.minute && ( <span className="text-xs text-slate-500">FT</span> )}
          {match.status === 'LIVE' && ( <span className="text-xs font-medium text-red-500 animate-pulse">{match.minute}'</span> )}
        </div>

        <div className="flex flex-col items-center text-center flex-1">
          {match.awayTeam.crestUrl && <img src={match.awayTeam.crestUrl} alt="" className="w-10 h-10 mb-1" />}
          <p className="font-medium text-slate-900 text-sm">{match.awayTeam.name}</p>
          <p className="text-xs text-slate-500">{match.awayTeam.shortName}</p>
        </div>
      </div>

      {(isLive || isFinished) && match.events && match.events.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
          {match.events.filter((e: any) => ['GOAL', 'YELLOW_CARD', 'RED_CARD'].includes(e.type)).slice(0, 4).map((event: any) => (
            <span key={event.id} className="text-xs px-2 py-0.5 bg-slate-50 rounded text-slate-600"> {event.minute}' {event.type === 'GOAL' ? '⚽' : event.type === 'YELLOW_CARD' ? '🟨' : '🟥'} {event.player?.displayName} </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCardSkeleton() {
  return ( <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse"> <div className="flex items-center justify-between"> <div className="flex items-center gap-3"> <div className="w-16 h-6 bg-slate-200 rounded" /> <div className="w-24 h-6 bg-slate-200 rounded" /> </div> <div className="w-24 h-6 bg-slate-200 rounded" /> </div> <div className="flex items-center justify-between gap-4 mt-4"> <div className="flex flex-col items-center flex-1"><div className="w-10 h-10 bg-slate-200 rounded-full mb-1" /><div className="h-4 w-20 bg-slate-200 rounded" /></div> <div className="w-24 h-8 bg-slate-200 rounded" /> <div className="flex flex-col items-center flex-1"><div className="w-10 h-10 bg-slate-200 rounded-full mb-1" /><div className="h-4 w-20 bg-slate-200 rounded" /></div> </div> </div> );
}