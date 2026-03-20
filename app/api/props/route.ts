import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ⚓ SCRAPER ANCHOR: The updateStats script will fill this.
// Do not change this variable name or formatting.
const TEAM_METRICS: Record<string, { off: number, def: number }> = {
  "Oklahoma City Thunder": {
    "off": 1.024,
    "def": 0.93
  },
  "San Antonio Spurs": {
    "off": 1.027,
    "def": 0.965
  },
  "Boston Celtics": {
    "off": 1.042,
    "def": 0.974
  },
  "Detroit Pistons": {
    "off": 1.018,
    "def": 0.951
  },
  "New York Knicks": {
    "off": 1.035,
    "def": 0.977
  },
  "Cleveland Cavaliers": {
    "off": 1.027,
    "def": 0.99
  },
  "Denver Nuggets": {
    "off": 1.051,
    "def": 1.014
  },
  "Houston Rockets": {
    "off": 1.017,
    "def": 0.982
  },
  "Charlotte Hornets": {
    "off": 1.028,
    "def": 0.994
  },
  "Minnesota Timberwolves": {
    "off": 1.017,
    "def": 0.986
  },
  "Miami Heat": {
    "off": 1.002,
    "def": 0.976
  },
  "Toronto Raptors": {
    "off": 0.995,
    "def": 0.978
  },
  "Los Angeles Lakers": {
    "off": 1.024,
    "def": 1.012
  },
  "Phoenix Suns": {
    "off": 0.997,
    "def": 0.988
  },
  "Orlando Magic": {
    "off": 0.996,
    "def": 0.988
  },
  "Atlanta Hawks": {
    "off": 1,
    "def": 0.987
  },
  "Golden State Warriors": {
    "off": 0.997,
    "def": 0.992
  },
  "Los Angeles Clippers": {
    "off": 1.013,
    "def": 1.009
  },
  "Philadelphia 76ers": {
    "off": 0.997,
    "def": 1.001
  },
  "Portland Trail Blazers": {
    "off": 0.986,
    "def": 1.003
  },
  "Memphis Grizzlies": {
    "off": 0.986,
    "def": 1.011
  },
  "New Orleans Pelicans": {
    "off": 0.992,
    "def": 1.025
  },
  "Chicago Bulls": {
    "off": 0.98,
    "def": 1.019
  },
  "Dallas Mavericks": {
    "off": 0.958,
    "def": 1.002
  },
  "Milwaukee Bucks": {
    "off": 0.978,
    "def": 1.026
  },
  "Utah Jazz": {
    "off": 0.992,
    "def": 1.055
  },
  "Indiana Pacers": {
    "off": 0.953,
    "def": 1.029
  },
  "Brooklyn Nets": {
    "off": 0.947,
    "def": 1.031
  },
  "Sacramento Kings": {
    "off": 0.959,
    "def": 1.047
  },
  "Washington Wizards": {
    "off": 0.96,
    "def": 1.056
  }
};

export async function GET() {
  const oddsKey = process.env.NEXT_PUBLIC_ODDS_API_KEY;
  if (!oddsKey) return NextResponse.json({ error: 'Key Missing' }, { status: 500 });

  try {
    // 1. Load the Scraped Rosters from lib/rosters.json
    // Using process.cwd() ensures it finds the file in your root folder
    const rostersPath = path.resolve(process.cwd(), 'lib/rosters.json');
    let ROSTERS: Record<string, string> = {};
    
    if (fs.existsSync(rostersPath)) {
      ROSTERS = JSON.parse(fs.readFileSync(rostersPath, 'utf8'));
    }

    // 2. Fetch NBA Events from The Odds API
    const gamesRes = await fetch(`https://api.the-odds-api.com/v4/sports/basketball_nba/events?apiKey=${oddsKey}`);
    const games = await gamesRes.json();

    if (!Array.isArray(games)) return NextResponse.json({ error: 'API Error' }, { status: 500 });

    // 3. Fetch PrizePicks Props for the top 10 games
    const propPromises = games.slice(0, 10).map(async (game: any) => {
      const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/events/${game.id}/odds?apiKey=${oddsKey}&regions=us_dfs&markets=player_points,player_rebounds,player_assists&bookmakers=prizepicks`;
      const res = await fetch(url);
      return res.json();
    });

    const allGamesData = await Promise.all(propPromises);
    const results: any[] = [];

    allGamesData.forEach((gameData: any) => {
      if (!gameData.bookmakers) return;
      const pp = gameData.bookmakers.find((b: any) => b.key === 'prizepicks');
      if (!pp) return;

      const homeTeam = gameData.home_team;
      const awayTeam = gameData.away_team;

      pp.markets.forEach((market: any) => {
        market.outcomes.filter((o: any) => o.name === 'Over').forEach((outcome: any) => {
          const playerName = outcome.description;
          
          /**
           * 🏀 THE FIX: MATCH PLAYER TO TEAM
           * We check our ESPN-synced roster file first.
           */
          const playerTeam = ROSTERS[playerName] || homeTeam;
          
          // Logic: If the player is on the Home Team, their opponent is Away.
          // Otherwise, their opponent is Home.
          const opponent = (playerTeam === homeTeam) ? awayTeam : homeTeam;

          results.push({
            id: `${gameData.id}-${playerName}-${market.key}`.replace(/\s+/g, '-'),
            player: playerName,
            team: playerTeam,
            opponent: opponent,
            metric: market.key.replace('player_', '').toUpperCase(),
            line: outcome.point,
            // 📈 Pull the correct factors based on the mapping above
            offFactor: TEAM_METRICS[playerTeam]?.off || 1.0,
            defFactor: TEAM_METRICS[opponent]?.def || 1.0,
            bookie: "PrizePicks"
          });
        });
      });
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}