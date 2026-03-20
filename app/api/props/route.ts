import { NextResponse } from 'next/server';
import { PropPrediction } from '@/lib/types';

// Simulation of a statistical projection model
const getPlayerProjection = (playerName: string, bookieLine: number) => {
  // A real model would use: (0.7 * L10_Avg) + (0.3 * Season_Avg)
  // We use a controlled variance to simulate a model's prediction
  const variance = (Math.random() * 8) - 4; 
  return (bookieLine + variance).toFixed(1);
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase();
  
  const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });

  try {
    // 1. Fetch current NBA games
    const gamesRes = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_nba/events?apiKey=${apiKey}`
    );
    const games = await gamesRes.json();

    // 2. Fetch props for the first 8 games (adjust slice based on your API quota)
    const propPromises = games.slice(0, 8).map(async (game: any) => {
      // Inside the map function in route.ts:
const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/events/${game.id}/odds?apiKey=${apiKey}&regions=us&markets=player_points,player_rebounds,player_assists&bookmakers=draftkings`;
      const res = await fetch(url);
      return res.json();
    });

    const allPropsData = await Promise.all(propPromises);

    // 3. Transform and Fix Duplicate Keys
    let predictions: PropPrediction[] = allPropsData.flatMap((gameData: any) => {
      const market = gameData.bookmakers?.[0]?.markets?.[0];
      if (!market) return [];

      // FIX: Only look at 'Over' outcomes to avoid duplicate player cards
      // The line is the same for Over and Under, so we only need one to calculate edge
      const overOutcomes = market.outcomes.filter((o: any) => o.name === 'Over');

      return overOutcomes.map((outcome: any) => {
        const line = outcome.point;
        const player = outcome.description;
        const projection = getPlayerProjection(player, line);
        
        // Edge Calculation Formula:
        // Edge = ((Projection / Line) - 1) * 100
        const edgeValue = ((parseFloat(projection) / line) - 1) * 100;

        return {
          id: `${gameData.id}-${player.replace(/\s+/g, '-')}-points`,
          player: player,
          team: gameData.home_team,
          metric: 'Points',
          line: line,
          projection: projection,
          edge: edgeValue.toFixed(1),
          recommendation: edgeValue > 8 ? 'OVER' : edgeValue < -8 ? 'UNDER' : 'PASS',
        };
      });
    });

    // 4. Handle Search (Filter by Player Name)
    if (search) {
      predictions = predictions.filter(p => 
        p.player.toLowerCase().includes(search)
      );
    }

    // 5. SORT BY MOST PROBABLE (Highest absolute edge)
    // This puts the "Best Value" picks at the top of the list
    const sortedPredictions = predictions.sort((a, b) => 
      Math.abs(parseFloat(b.edge)) - Math.abs(parseFloat(a.edge))
    );

    return NextResponse.json(sortedPredictions);
  } catch (e) {
    console.error("Route Error:", e);
    return NextResponse.json({ error: 'Failed to fetch live props' }, { status: 500 });
  }
}