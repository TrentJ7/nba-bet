import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_PATH = path.resolve(__dirname, '../lib/rosters.json');

async function syncRosters() {
  try {
    console.log("📡 Connecting to ESPN API for 2026 Rosters...");
    
    // 1. Get the list of all NBA Teams
    const teamsRes = await axios.get('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams');
    const teamEntries = teamsRes.data.sports[0].leagues[0].teams;

    const rosterMap = {};
    let playerCount = 0;

    // 2. Map through teams and fetch rosters
    const rosterPromises = teamEntries.map(async (entry) => {
      const team = entry.team;
      const teamName = team.displayName;
      
      try {
        // Fetch specific roster
        const rosterRes = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${team.id}/roster`);
        
        /**
         * 🛠️ THE FIX: Flat Array Logic
         * ESPN returns 'athletes' as a direct array of player objects.
         */
        const players = rosterRes.data.athletes || [];
        
        players.forEach(player => {
          // We use fullName to match the names on PrizePicks/Odds API
          if (player.fullName) {
            rosterMap[player.fullName] = teamName;
            playerCount++;
          }
        });

      } catch (e) {
        console.error(`❌ Failed to fetch: ${teamName} (ID: ${team.id})`);
      }
    });

    await Promise.all(rosterPromises);

    if (playerCount === 0) {
      throw new Error("API connected but 0 players were found in the response.");
    }

    // 3. Save to File
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(rosterMap, null, 2));
    
    console.log(`✅ Success! ${playerCount} players mapped to teams.`);
    console.log(`💾 Saved to: ${OUTPUT_PATH}`);

  } catch (error) {
    console.error("❌ API Sync Failed:", error.message);
  }
}

syncRosters();