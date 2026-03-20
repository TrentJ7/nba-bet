import { NextResponse } from 'next/server';

// THE SCRAPER TARGET (Do not change this variable name or formatting)
const TEAM_METRICS: Record<string, { off: number, def: number }> = {
  "Oklahoma City Thunder": {
    "off": 1.024,
    "def": 0.93
  },
  "San Antonio Spurs": {
    "off": 1.029,
    "def": 0.966
  },
  "Boston Celtics": {
    "off": 1.042,
    "def": 0.974
  },
  "Detroit Pistons": {
    "off": 1.018,
    "def": 0.952
  },
  "New York Knicks": {
    "off": 1.035,
    "def": 0.977
  },
  "Cleveland Cavaliers": {
    "off": 1.028,
    "def": 0.991
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
    "off": 1.027,
    "def": 0.994
  },
  "Minnesota Timberwolves": {
    "off": 1.017,
    "def": 0.986
  },
  "Miami Heat": {
    "off": 1.001,
    "def": 0.974
  },
  "Toronto Raptors": {
    "off": 0.995,
    "def": 0.978
  },
  "Orlando Magic": {
    "off": 0.996,
    "def": 0.986
  },
  "Los Angeles Lakers": {
    "off": 1.022,
    "def": 1.01
  },
  "Phoenix Suns": {
    "off": 0.998,
    "def": 0.989
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
    "off": 1.014,
    "def": 1.01
  },
  "Philadelphia 76ers": {
    "off": 0.994,
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
    "off": 0.993,
    "def": 1.027
  },
  "Chicago Bulls": {
    "off": 0.981,
    "def": 1.019
  },
  "Milwaukee Bucks": {
    "off": 0.98,
    "def": 1.025
  },
  "Dallas Mavericks": {
    "off": 0.958,
    "def": 1.002
  },
  "Utah Jazz": {
    "off": 0.991,
    "def": 1.058
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
    "off": 0.958,
    "def": 1.045
  },
  "Washington Wizards": {
    "off": 0.962,
    "def": 1.056
  }
};

export async function GET() {
  const oddsKey = process.env.NEXT_PUBLIC_ODDS_API_KEY;
  if (!oddsKey) return NextResponse.json({ error: 'Key Missing' }, { status: 500 });

  try {
    const gamesRes = await fetch(`https://api.the-odds-api.com/v4/sports/basketball_nba/events?apiKey=${oddsKey}`);
    const games = await gamesRes.json();

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

      pp.markets.forEach((market: any) => {
        market.outcomes.filter((o: any) => o.name === 'Over').forEach((outcome: any) => {
          const player = outcome.description;
          // Logic: If home team isn't the player, they are away.
          const isHome = gameData.home_team.includes(player) || player.includes(gameData.home_team);
          const playerTeam = isHome ? gameData.home_team : gameData.away_team;
          const opponent = isHome ? gameData.away_team : gameData.home_team;

          results.push({
            id: `${gameData.id}-${player}-${market.key}`.replace(/\s+/g, '-'),
            player,
            team: playerTeam,
            opponent,
            metric: market.key.replace('player_', '').toUpperCase(),
            line: outcome.point,
            offFactor: TEAM_METRICS[playerTeam]?.off || 1.0,
            defFactor: TEAM_METRICS[opponent]?.def || 1.0,
            bookie: "PrizePicks"
          });
        });
      });
    });

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}