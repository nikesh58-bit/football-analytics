import { TeamGrid } from '@/components/teams/TeamGrid';
import { LiveMatches } from '@/components/matches/LiveMatches';
import { TopScorers } from '@/components/analytics/TopScorers';
import { SearchBar } from '@/components/ui/SearchBar';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export default async function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 w-full">
        <div className="mb-8"> <h1 className="text-3xl font-bold text-slate-900 mb-2">Premier League Analytics</h1> <p className="text-slate-600">Advanced statistics, shot maps, player comparisons & tactical analysis</p> </div>
        <SearchBar />
        <div className="grid gap-8 mt-8"> <LiveMatches /> <TopScorers /> <TeamGrid /> </div>
      </main>
      <Footer />
    </div>
  );
}