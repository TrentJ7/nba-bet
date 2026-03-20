import { NextResponse } from 'next/server';
import { PropPrediction } from '@/lib/types';

// Helper to simulate a "Statistical Projection" 
// In a production app, you'd fetch the player's L10 average from an API like BallDontLie
const getPlayerProjection = (playerName: string, bookieLine: number) => {
  // Logic: For a real CS project, you'd use: (0.7 * Last10Avg) + (0.3 * SeasonAvg)
  // For now, we'll use a weighted random to simulate a model's variance
  const variance = (Math.random() * 6) - 2.5; 
  return (bookieLine + variance).toFixed(1);
};

export async function GET(request: Request) {
  const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });

  try {
    // 1. Fetch live NBA games to get Event IDs
    const gamesRes = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_nba/events?apiKey=${apiKey}`
    );
    const games = await gamesRes.json();

    // 2. Fetch Props for the first 5 games (to stay within free tier limits)
    const propPromises = games.slice(0, 5).map(async (game: any) => {
      const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/events/${game.id}/odds?apiKey=${apiKey}&regions=us&markets=player_points&bookmakers=draftkings`;
      const res = await fetch(url);
      return res.json();
    });

    const allPropsData = await Promise.all(propPromises);

    // 3. Transform Raw API data into PropPrediction format
    const actualPredictions: PropPrediction[] = allPropsData.flatMap((gameData: any) => {
      const market = gameData.bookmakers?.[0]?.markets?.[0];
      if (!market) return []; // Skip games with no lines yet

      return market.outcomes.map((outcome: any) => {
        const line = outcome.point;
        const player = outcome.description;
        const projection = getPlayerProjection(player, line);
        
        // Calculate the Edge
        const edgeValue = ((parseFloat(projection) / line) - 1) * 100;

        return {
          id: `${gameData.id}-${player}`,
          player: player,
          team: gameData.home_team,
          metric: 'Points',
          line: line,
          projection: projection,
          edge: edgeValue.toFixed(1),
          recommendation: edgeValue > 7 ? 'OVER' : edgeValue < -7 ? 'UNDER' : 'PASS',
        };
      });
    });

    // Sort by highest edge so the best bets are at the top
    const sortedPredictions = actualPredictions.sort((a, b) => 
      Math.abs(parseFloat(b.edge)) - Math.abs(parseFloat(a.edge))
    );

    return NextResponse.json(sortedPredictions);
  } catch (e) {
    console.error("Extraction Error:", e);
    return NextResponse.json({ error: 'Failed to process sports data' }, { status: 500 });
  }
}