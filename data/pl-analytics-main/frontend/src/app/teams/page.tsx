'use client';

import { useState } from 'react';
import { useTeams } from '@/hooks/useApi';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function TeamsPage() {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [competition, setCompetition] = useState('');
  
  const { data, isLoading } = useTeams({ search, country, competitionId: competition, limit: '50' });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">All Teams</h1>
          <p className="text-slate-600">Browse teams across all competitions</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <select value={country} onChange={e => setCountry(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">All Countries</option>
              <option value="England">England</option>
              <option value="Spain">Spain</option>
              <option value="Germany">Germany</option>
              <option value="Italy">Italy</option>
              <option value="France">France</option>
            </select>
            <select value={competition} onChange={e => setCompetition(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">All Competitions</option>
              <option value="premier-league">Premier League</option>
              <option value="la-liga">La Liga</option>
              <option value="bundesliga">Bundesliga</option>
              <option value="serie-a">Serie A</option>
              <option value="ligue-1">Ligue 1</option>
              <option value="champions-league">Champions League</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => ( <TeamCardSkeleton key={i} /> ))}
          </div>
        ) : data?.data?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.data.map((team: any) => ( <Link key={team.id} href={`/teams/${team.id}`} className="group"> <TeamCard team={team} /> </Link> ))}
          </div>
        ) : (
          <div className="text-center py-16"> <p className="text-slate-500">No teams found</p> </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
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

function TeamCard({ team }: { team: any }) {
  return ( <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-lg transition-all duration-200"> <div className="flex items-center justify-center gap-3 mb-3"> {team.crestUrl && ( <img src={team.crestUrl} alt="" className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" /> )} <div className="text-center"> <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">{team.name}</h3> <p className="text-xs text-slate-500">{team.shortName}</p> </div> </div> <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-slate-100"> <div> <span className="font-medium text-slate-700">{team._count?.players || 0}</span> <p className="text-slate-400">Players</p> </div> <div> <span className="font-medium text-slate-700">{team._count?.homeMatches + team._count?.awayMatches || 0}</span> <p className="text-slate-400">Matches</p> </div> <div> <span className="font-medium text-slate-700">{team.city}</span> <p className="text-slate-400">City</p> </div> </div> </div> );
}

function TeamCardSkeleton() {
  return ( <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse"> <div className="flex items-center justify-center gap-3 mb-3"> <div className="w-12 h-12 bg-slate-200 rounded-full" /> <div className="flex-1 space-y-2"> <div className="h-4 w-32 bg-slate-200 rounded mx-auto" /> <div className="h-3 w-16 bg-slate-200 rounded mx-auto" /> </div> </div> <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100"> {[...Array(3)].map((_, i) => ( <div key={i} className="text-center"> <div className="h-6 w-12 bg-slate-200 rounded mx-auto mb-1" /> <div className="h-3 w-16 bg-slate-200 rounded mx-auto" /> </div> ))} </div> </div> );
}