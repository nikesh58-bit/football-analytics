import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const premierLeague = await prisma.competition.upsert({
    where: { optaId: 8 },
    create: { optaId: 8, name: 'Premier League', shortName: 'PL', country: 'England', logoUrl: 'https://images.sportmonks.com/competitions/8.png', type: 'LEAGUE' },
    update: {},
  });

  const currentSeason = await prisma.season.upsert({
    where: { competitionId_name: { competitionId: premierLeague.id, name: '2023/2024' } },
    create: { competitionId: premierLeague.id, name: '2023/2024', startDate: new Date('2023-08-11'), endDate: new Date('2024-05-19'), isCurrent: true },
    update: { isCurrent: true },
  });

  const teams = [
    { optaId: 42, name: 'Arsenal', shortName: 'ARS', city: 'London', founded: 1886, stadium: 'Emirates Stadium', capacity: 60704 },
    { optaId: 43, name: 'Aston Villa', shortName: 'AVL', city: 'Birmingham', founded: 1874, stadium: 'Villa Park', capacity: 42785 },
    { optaId: 44, name: 'Bournemouth', shortName: 'BOU', city: 'Bournemouth', founded: 1899, stadium: 'Vitality Stadium', capacity: 11364 },
    { optaId: 45, name: 'Brentford', shortName: 'BRE', city: 'London', founded: 1889, stadium: 'Gtech Community Stadium', capacity: 17250 },
    { optaId: 46, name: 'Brighton', shortName: 'BHA', city: 'Brighton', founded: 1901, stadium: 'Amex Stadium', capacity: 31800 },
    { optaId: 47, name: 'Burnley', shortName: 'BUR', city: 'Burnley', founded: 1882, stadium: 'Turf Moor', capacity: 21944 },
    { optaId: 48, name: 'Chelsea', shortName: 'CHE', city: 'London', founded: 1905, stadium: 'Stamford Bridge', capacity: 40834 },
    { optaId: 49, name: 'Crystal Palace', shortName: 'CRY', city: 'London', founded: 1905, stadium: 'Selhurst Park', capacity: 25486 },
    { optaId: 50, name: 'Everton', shortName: 'EVE', city: 'Liverpool', founded: 1878, stadium: 'Goodison Park', capacity: 39572 },
    { optaId: 51, name: 'Fulham', shortName: 'FUL', city: 'London', founded: 1879, stadium: 'Craven Cottage', capacity: 25700 },
    { optaId: 52, name: 'Liverpool', shortName: 'LIV', city: 'Liverpool', founded: 1892, stadium: 'Anfield', capacity: 53394 },
    { optaId: 53, name: 'Luton', shortName: 'LUT', city: 'Luton', founded: 1885, stadium: 'Kenilworth Road', capacity: 10356 },
    { optaId: 54, name: 'Manchester City', shortName: 'MCI', city: 'Manchester', founded: 1880, stadium: 'Etihad Stadium', capacity: 53400 },
    { optaId: 55, name: 'Manchester United', shortName: 'MUN', city: 'Manchester', founded: 1878, stadium: 'Old Trafford', capacity: 74310 },
    { optaId: 56, name: 'Newcastle', shortName: 'NEW', city: 'Newcastle', founded: 1892, stadium: "St James' Park", capacity: 52305 },
    { optaId: 57, name: 'Nottingham Forest', shortName: 'NOT', city: 'Nottingham', founded: 1865, stadium: 'City Ground', capacity: 30445 },
    { optaId: 58, name: 'Sheffield United', shortName: 'SHU', city: 'Sheffield', founded: 1889, stadium: 'Bramall Lane', capacity: 32050 },
    { optaId: 59, name: 'Tottenham', shortName: 'TOT', city: 'London', founded: 1882, stadium: 'Tottenham Hotspur Stadium', capacity: 62850 },
    { optaId: 60, name: 'West Ham', shortName: 'WHU', city: 'London', founded: 1895, stadium: 'London Stadium', capacity: 62500 },
    { optaId: 61, name: 'Wolves', shortName: 'WOL', city: 'Wolverhampton', founded: 1877, stadium: 'Molineux', capacity: 32050 },
  ];

  for (const team of teams) {
    const { capacity, ...rest } = team;
    await prisma.team.upsert({ where: { optaId: team.optaId }, create: { ...rest, stadiumCapacity: capacity, crestUrl: `https://images.sportmonks.com/teams/${team.optaId}.png`, country: 'England' }, update: {} });
  }

  console.log('✅ Database seeded successfully!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });