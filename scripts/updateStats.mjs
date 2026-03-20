import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROUTE_PATH = path.resolve(__dirname, '../app/api/props/route.ts');

async function syncTeamMetrics() {
  const url = 'https://www.basketball-reference.com/leagues/NBA_2026_ratings.html';
  
  try {
    console.log("📡 Scraping Bivariate Team Data...");
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    
    const teamData = [];
    let totalOff = 0, totalDef = 0;

    $('#ratings tbody tr').each((i, el) => {
      const name = $(el).find('td[data-stat="team_name"] a').text().trim();
      const off = parseFloat($(el).find('td[data-stat="off_rtg"]').text());
      const def = parseFloat($(el).find('td[data-stat="def_rtg"]').text());
      
      if (name && !isNaN(off) && !isNaN(def)) {
        teamData.push({ name, off, def });
        totalOff += off;
        totalDef += def;
      }
    });

    const avgOff = totalOff / teamData.length;
    const avgDef = totalDef / teamData.length;
    const metrics = {};

    teamData.forEach(t => {
      metrics[t.name] = {
        off: parseFloat((t.off / avgOff).toFixed(3)),
        def: parseFloat((t.def / avgDef).toFixed(3))
      };
    });

    console.log("💾 Updating route.ts...");
    let routeContent = fs.readFileSync(ROUTE_PATH, 'utf8');
    const regex = /(const TEAM_METRICS: Record<string, { off: number, def: number }> = )([\s\S]*?)(;)/;
    const updatedContent = routeContent.replace(regex, `$1${JSON.stringify(metrics, null, 2)}$3`);

    fs.writeFileSync(ROUTE_PATH, updatedContent, 'utf8');
    console.log(`✅ Success! Synced 30 teams. Off-Avg: ${avgOff.toFixed(1)} | Def-Avg: ${avgDef.toFixed(1)}`);

  } catch (error) {
    console.error("❌ Sync Failed:", error.message);
  }
}

syncTeamMetrics();