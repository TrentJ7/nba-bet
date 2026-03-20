import { NextResponse } from 'next/server';
import { PropPrediction } from '@/lib/types';

export async function GET(request: Request) {
  const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY;

  if (!apiKey) return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });

  try {
    // We fetch current NBA games
    const res = await fetch(`https://api.the-odds-api.com/v4/sports/basketball_nba/events?apiKey=${apiKey}&regions=us`);
    const games = await res.json();

    // Mock data for the demonstration (Replace with actual prop logic later)
    const mockPredictions: PropPrediction[] = [
      {
        id: '1',
        player: 'LeBron James',
        team: 'LAL',
        metric: 'Points',
        line: 25.5,
        projection: '28.2',
        edge: '10.5',
        recommendation: 'OVER',
      }
    ];

    return NextResponse.json(mockPredictions);
  } catch (e) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}