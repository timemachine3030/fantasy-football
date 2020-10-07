import axios from 'axios';
import cheerio from 'cheerio';
import URL from 'url';
import fs from 'fs';


console.log('Here');


//const PLAYER_STAT_PAGE = 'https://www.espn.com/nfl/player/gamelog/_/id/{playerId}/type/nfl/year/{year}';
//const SEASON_PASSING_STATS = 'https://www.espn.com/nfl/stats/player/_/season/{year}/seasontype/2/table/passing/sort/passingYards/dir/desc';
//const CURRENT_PASSING_STATS = 'https://www.espn.com/nfl/stats/player/_/table/passing/sort/passingYards/dir/desc';


// https://www.espn.com/nfl/boxscore?gameId=401127927
//https://www.espn.com/nfl/matchup?gameId=401128034
//https://www.espn.com/nfl/team/schedule/_/name/ari

const TEAM_SEASON = 'https://www.espn.com/nfl/team/schedule/_/name/{shortid}/season/{year}'

const TOTAL_TEAM_DEFENSE = 'https://www.espn.com/nfl/stats/team/_/view/defense/season/{year}/seasontype/2/table/passing/sort/netYardsPerGame/dir/asc';
const PASSING_DEFENSE = 'https://www.espn.com/nfl/stats/team/_/view/defense/stat/passing/season/{year}/seasontype/2/table/passing/sort/sacks/dir/desc';
const TURNOVER_STATS = 'https://www.espn.com/nfl/stats/team/_/view/turnovers/season/{year}/seasontype/2/table/miscellaneous/sort/turnOverDifferential/dir/desc';

const buildUrl = function (url, replacements) {
    const reFind = /\{([^\}]+)\}/g

    return url.replace(reFind, (match, found) => {
        return replacements[found];


    });
}

function linkToTeamId(url) {
    const locations = url.split('/');
    return locations[locations.length - 1];
}

async function getPlayerIds(year = 2019) {
    const url = buildUrl(PASSING_DEFENSE, { year });
    const response = await axios({
        method: 'GET',
        url
    });

    const teamCellSelector = '#fittPageContainer > div.page-container.cf > div > div > section > div > div.ResponsiveTable.ResponsiveTable--fixed-left.mt4.Table2__title--remove-capitalization > div.flex > table > tbody > tr:nth-child(1) > td'

    const $ = cheerio.load(response.data);

    const teams = $(teamCellSelector).map((i, row) => {
        const id = linkToTeamId($(row).find('a').first().attr('href'));
        const name = $(row).find('a').first().text().trim();
        
        const team = { id, name };

        return team;
        
    });
    
    return teams;

}

async function getTeamSchedules(shortid, year) {
    const url = buildUrl(TEAM_SEASON, { shortid, year });
    const response = await axios({
        method: 'GET',
        url
    });

    const $ = cheerio.load(response.data);
    const oppRowSelector = '#fittPageContainer > div.StickyContainer > div.page-container.cf > div > div.layout__column.layout__column--1 > section > div > section > section > div > div > div > div.Table__Scroller > table > tbody > tr';
    const opps = $(oppRowSelector);
    let skip = true;
    let season = 'Post';

    const games = [];

    try {

        // Skip header rows and preseason
        for(let i = 0; i < 18; i += 1) {
            const row = $(opps).get(i);
            let wk = $(row).find('td:nth-child(1)').text().trim();
            if (skip) {
                if (wk === 'Regular Season') {
                    season = wk;
                }
                continue;
            }
            if (season === 'Regular Season' && wk == 'WK') {
                skip = false;
                continue;
            }
            if (wk === 'Preseason') {
                skip = true;
                continue;
            }
            
            // ok found the opponents
            const opponent = $(row).find('.opponent-logo a').attr('href');
            const rowLinks = $(row).find('a');
            const oppHref = $(rowLinks).get(2).attr('href');
            const gameOpp = {
                shortid: oppHref.split('/').slice(-1),
                id: oppHref.split('/').slice(-2, 1),
            }
            const href = $(rowLinks)[4].attr('href');
            const gameId = href.split('/').slice(-1); // http://www.espn.com/nfl/game/_/gameId/401131043
            
            games.push({
                id: gameId,
                opp: gameOpp
            });
        }
    } catch (err) {
        throw error;
    }

    return games;
}

async function getPageCache(year) {
    const pages = {
        totalDefense: '',
        passingDefense: '',
        turnoverStats: '',
    }

    const totalDefenseUrl = buildUrl(TOTAL_TEAM_DEFENSE, { year });
    const passingDefenseUrl = buildUrl(PASSING_DEFENSE, { year });
    const turnoverStatsUrl = buildUrl(TURNOVER_STATS, { year });

    pages.totalDefense = await axios({
        method: 'GET',
        url: totalDefenseUrl,
    });

    pages.passingDefense = await axios({
        method: 'GET',
        url: passingDefenseUrl,
    });

    pages.turnoverStats = await axios({
        method: 'GET',
        url: turnoverStatsUrl,
    });

    return pages;
}

const getYearStatSummary = async function (playerId, year) {

    // Get all the pages first, so we have some level of cache when in a looping context.

    getTotalTeamDefense()

    const url = buildUrl(PLAYER_STAT_PAGE, {playerId, year});
 
    //  const response = await axios({
    //      method: 'GET',
    //      url
    //  });
 
    //  const $ = cheerio.load(response.data);
    //  const tblHeading = [
    //      'date',
    //      'opponent',
    //      'game_result',
    //      'passing_completions',
    //      'passing_attempts',
    //      'passing_yards',
    //      'passing_completion_percent',
    //      'passing_avg_yards',
    //      'passing_touchdowns',
    //      'passing_interceptions',
    //      'passing_longest',
    //      'total_sacks',
    //      'rating',
    //      'adjusted_rating',
    //      'rushing_attempts',
    //      'rushing_yards',
    //      'rushing_avg_yards',
    //      'rushing_touchdowns',
    //      'longest_rush'
    //  ];
 
    //  const nameSelector = '#fittPageContainer > div.StickyContainer > div.ResponsiveWrapper > div > div > div.PlayerHeader__Left.flex.items-center.justify-start.overflow-hidden.brdr-clr-gray-09 > div.PlayerHeader__Main.flex.items-center > div.PlayerHeader__Main_Aside.min-w-0.flex-grow.flex-basis-0 > h1 > span:nth-child(2)'
    //  const selector = '#fittPageContainer > div.StickyContainer > div:nth-child(5) > div > div.PageLayout__Main > div.ResponsiveWrapper > div > div > div > div > div > div > div > div.Table__Scroller > table > tbody';            
    //  const tables = $(selector);
    //  const playerName = $(nameSelector).text().trim();
 
    //  let data = {
    //      playerId,
    //      year,
    //      stats: [],
    //      playerName,
    //  };
 
    //  $(tables[tables.length - 1]).each((idx, table) => {
    //      $(table).find('tr').each((j, tr) => {
    //          let statLine = {};
    //          if ($(tr).hasClass('totals_row')) {
    //              return;
    //          }
    //          $(tr).find("td").each((i, d) => {
    //              statLine[tblHeading[i]] = $(d).text();
    //          });
    //          data.stats.push(statLine);
    //      })
    //  });
     
    //  return data; 
}


// Test
import chai from 'chai';
const expect = chai.expect;

describe('Defense Scraper', () => {
    describe('pathToTeamId', () => {
        it('returns the last part', () => {
            expect(linkToTeamId('nfl/team/_/name/ne/new-england-patriots')).to.eql('new-england-patriots');
        });
    });
    describe('getPageCache', () => {
        it('loads 3 pages', async () => {
            const pages = await getPageCache(2019);

            expect(pages.totalDefense.status).to.eql(200);
            expect(pages.passingDefense.status).to.eql(200);
            expect(pages.turnoverStats.status).to.eql(200);
        });
    });
    describe.skip('getPlayerIds', async () => {
        const teams = await getPlayerIds(2019);
        const stillers = teams.find((t) => {
            return t.id === 'pittsburgh-steelers';
        });
        
        expect(stillers).to.be.ok;
        expect(stillers.name).to.eql('Pittsburgh Steelers');
    });
    describe('getTeamSchedules', async () => {
        const games = await getTeamSchedules('ari', 2019);
        const game = games[0];
        expect(game.id).to.eql('401131043');
        expect(game.opp.id).to.eql('hou');
    });
    
    describe.skip('getYearStatSummary', () => {
        it('find Lamar reg season', async () => {
            const result = await getYearStatSummary('3916387', '2019');
            expect(result.playerId).to.eql('3916387');
            expect(result.year).to.eql('2019');
            expect(result.stats).to.be.an('array');
            expect(result.stats[0].opponent).to.eql('@CLE')
            expect(result.playerName).to.eql('Jackson')
        });
        it('find Dak reg season', async () => {
            const result = await getYearStatSummary('2577417', '2019');
            expect(result.playerId).to.eql('2577417');
            expect(result.year).to.eql('2019');
            expect(result.stats).to.be.an('array');
            expect(result.stats[0].opponent).to.eql('vsWSH')
            expect(result.stats.length).to.eql(16);
        });
    });
    describe.skip('buildUrl', () => {
        it('replaces year and id', () => {
            let a = buildUrl("https://{playerId}/something/{year}", { playerId: 1000, year: 2023 });

            expect(a).to.eql("https://1000/something/2023")
        });
    });
    describe.skip('All Players', () => {
        it('get all the data', async () => {
            const ids = await getPayerIds(2019);

            const playerData = await Promise.all(ids.map((id) => {
                return getYearStatSummary(id, '2019');
            }));
            fs.writeFileSync('./qb-data-sample.json', JSON.stringify(playerData));

            expect(playerData).to.be.an('array');
            expect(playerData.length).to.eql(41);
            //expect(playerData[0].playerId).to.eql('2969939');
            //expect(playerData[playerData.length - 1].playerId).to.eql('12477');

            playerData.forEach((d) => {
                try {
                    expect(d.stats).to.be.an('array');
                    expect(d.stats.length).to.be.greaterThan(0);
                } catch (error) {
                    console.error(error.message);
                    console.log('problem with: ' + buildUrl(PLAYER_STAT_PAGE, { playerId: d.playerId, year: d.year }));
                }
            });
            fs.writeFileSync('./qb-data.json', JSON.stringify(playerData));

        });
    });

    describe.skip('Check Data', () => {
        it('players have stats', () => {
            const data = JSON.parse(fs.readFileSync('./qb-data.json'));
            data.forEach((d) => {
                try {
                    expect(d.stats).to.be.an('array');
                    expect(d.stats.length).to.be.greaterThan(0);
                } catch (ignore) {
                    console.error(ignore.message);
                    console.log('problem with:' + buildUrl(PLAYER_STAT_PAGE, { playerId: d.playerId, year: d.year }));
                }
            });
        })
    });
    
});

