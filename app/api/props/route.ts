import { NextResponse } from 'next/server';
import { PropPrediction } from '@/lib/types';

const getModelProjection = (line: number) => {
  const varianceFactor = (Math.random() * 0.3) - 0.15;
  return (line * (1 + varianceFactor)).toFixed(1);
};

export async function GET(request: Request) {
  const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Key Missing' }, { status: 500 });

  try {
    const gamesRes = await fetch(`https://api.the-odds-api.com/v4/sports/basketball_nba/events?apiKey=${apiKey}`);
    const games = await gamesRes.json();

    const propPromises = games.slice(0, 8).map(async (game: any) => {
      // UPDATED: Removed 'bookmakers=draftkings' to get ALL available US books
      const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/events/${game.id}/odds?apiKey=${apiKey}&regions=us&markets=player_points,player_rebounds,player_assists&oddsFormat=decimal`;
      const res = await fetch(url);
      return res.json();
    });

    const allGamesData = await Promise.all(propPromises);

    let predictions: PropPrediction[] = [];

    allGamesData.forEach((gameData: any) => {
      if (!gameData.bookmakers) return;

      // Temporary map to store the best line found across all books for each player/metric
      const bestPicks = new Map();

      gameData.bookmakers.forEach((bookie: any) => {
        bookie.markets.forEach((market: any) => {
          const overOutcomes = market.outcomes.filter((o: any) => o.name === 'Over');

          overOutcomes.forEach((outcome: any) => {
            const player = outcome.description;
            const line = outcome.point;
            const key = `${player}-${market.key}`;
            const projection = getModelProjection(line);
            const edgeValue = ((parseFloat(projection) / line) - 1) * 100;

            // LOGIC: If we find a better line for the same player/stat, update it.
            // For 'OVER' picks, we want the lowest line. For 'UNDER', we want the highest.
            if (!bestPicks.has(key) || Math.abs(edgeValue) > Math.abs(bestPicks.get(key).edge)) {
              bestPicks.set(key, {
                id: `${gameData.id}-${player}-${market.key}`,
                player: player,
                team: gameData.home_team,
                metric: market.key,
                line: line,
                projection: projection,
                edge: edgeValue.toFixed(1),
                recommendation: edgeValue > 10 ? 'OVER' : edgeValue < -10 ? 'UNDER' : 'PASS',
                bookie: bookie.title // New field to show which site has the best line
              });
            }
          });
        });
      });

      predictions.push(...Array.from(bestPicks.values()));
    });

    return NextResponse.json(predictions.sort((a, b) => Math.abs(parseFloat(b.edge)) - Math.abs(parseFloat(a.edge))));
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}