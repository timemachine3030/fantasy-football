/*
Produce a JSON object
year -> [teamid -> gameid:{
    opponent:
    defensive stats:
}] 
*/

import createRequire from 'module';
import http from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import rateLimit from 'axios-rate-limit';

const axios = rateLimit(http.create(), {
    maxRPS: 4
});

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
const GAME_BOX_SCORE = 'https://www.espn.com/nfl/boxscore?gameId={gameID}'

const buildUrl = function (url, replacements) {
    const reFind = /\{([^\}]+)\}/g

    return url.replace(reFind, (match, found) => {
        return replacements[found];


    });
}
const buildDataModel = async function (season) {
    let scores = {}
    for (let i=0; i < season.length; i++){
        if (i % 64 === 0) {
            process.stdout.write('\n');
        }
        let id = season[i].id
        if (!scores[id]){
            scores[id] = season[i]
            scores[id].score = await getGameScore(id) 
            process.stdout.write('f');
        } else {
            process.stdout.write('c');
        }
    }
    // TO DO: plug in away team scores
    return scores;
};
const getGameScore = async function (gameID) {
    const gameScore = buildUrl(GAME_BOX_SCORE, { gameID })
    const response = await axios({
        method: 'GET',
        url: gameScore,
    });
    const $ = cheerio.load(response.data)
    const basicStatSelector = '#gamepackage-{type} > div > .gamepackage-{otherTeam}-wrap > div > div > table > tbody > tr.highlight > td.{collumn}'
    let statSelector = buildUrl(basicStatSelector, {
        type: 'passing',
        otherTeam: 'away',
        collumn: 'yds',

    });
    const awayPassingyards = $(statSelector).text()
    statSelector = buildUrl(basicStatSelector, {
        type: 'rushing',
        otherTeam: 'away',
        collumn: 'yds',

    })
    const awayRushingingyards = $(statSelector).text()

    statSelector = buildUrl(basicStatSelector, {
        type: 'passing',
        otherTeam: 'home',
        collumn: 'yds',

    })
    const homePassingyards = $(statSelector).text()
    statSelector = buildUrl(basicStatSelector, {
        type: 'rushing',
        otherTeam: 'home',
        collumn: 'yds',

    })
    const homeRushingingyards = $(statSelector).text()
    const defensiveStats = {
        homeTeam: parseInt(awayPassingyards, 10) + parseInt(awayRushingingyards, 10),
        awayTeam: parseInt(homePassingyards, 10) + parseInt(homeRushingingyards, 10),
    }
    return defensiveStats;
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
async function getTeamShortID(year) {
    const url = buildUrl(TEAM_SEASON, { shortid: 'ari', year });
    const response = await axios({
        method: 'GET',
        url
    });
    const $ = cheerio.load(response.data);
    const options = '#fittPageContainer > div.StickyContainer > div.page-container.cf > div > div.layout__column.layout__column--1 > section > div > section > div.flex.justify-between.mt3.mb3.items-center > div > select:nth-child(2) option'
    const teams = []
    $(options).each((i, team) => {
        let shortid = $(team).data('param-value');
        if (shortid) {
            teams.push(shortid)
        }
    })
    return teams;
}
async function getAllTeamsSchedules(year) {
    const teams = await getTeamShortID(year);
    let schedules = []
    for (let t = 0; t < teams.length; t += 1) {
        let schedule = await getTeamSchedules(teams[t], year);
        schedules = schedules.concat(schedule);
    }
    return schedules;
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
        for (let i = 0; i < 18; i += 1) {
            const row = $(opps).get(i);
            let wk = $(row).find('td:nth-child(1)').text().trim();
            if (season === 'Regular Season' && wk == 'WK') {
                skip = false;
                continue;
            }
            if (skip) {
                if (wk === 'Regular Season') {
                    season = wk;
                }
                continue;
            }
            if (wk === 'Preseason') {
                skip = true;
                continue;
            }

            // ok found the opponents
            const opponent = $(row).find('.opponent-logo a').attr('href');
            const rowLinks = $(row).find('a');
            const oppHref = $($(rowLinks).get(1)).attr('href');
            if (oppHref === undefined) {
                continue;
            }
            const gameOpp = {
                id: oppHref.split('/')[6],
                shortid: oppHref.split('/')[5],
            }
            const href = $($(rowLinks).get(2)).attr('href');
            const gameId = href.split('/').slice(-1)[0]; // http://www.espn.com/nfl/game/_/gameId/401131043
            const location = $(row).find('.opponent-logo .pr2:nth-child(1)').text();
            let homeTeam = gameOpp.shortid;
            let awayTeam = shortid;
            if (location === "vs") {
                homeTeam = shortid;
                awayTeam = gameOpp.shortid;
            }
            games.push({
                id: gameId,
                homeTeam, awayTeam

            });
        }
    } catch (error) {
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

    const url = buildUrl(PLAYER_STAT_PAGE, { playerId, year });

}


// Test
import chai from 'chai';
const expect = chai.expect;

describe('Defense Scraper', () => {
    describe('Get Game Score ', () => {
        it('get score', async () => {
            const score = await getGameScore('401127999')
            expect(score.homeTeam).to.eql(477)
            expect(score.awayTeam).to.eql(387)
        })
        it('For whole team', async () => {
            const text = fs.readFileSync('./schedules-data.JSON', 'utf-8')
            const season = JSON.parse(text)
            const scores = await buildDataModel(season)
            const json = JSON.stringify(scores);
            fs.writeFileSync('./season-defense.json', json);
        })
    })
    describe.skip('write all team schedules', () => {
        it('2019', async () => {
            const schedules = await getAllTeamsSchedules(2019);
            const text = JSON.stringify(schedules);
            fs.writeFileSync('./schedules-data.JSON', text);
        })
    })
    describe('getTeamsShortID', () => {
        it('getsTeams', async () => {
            const teams = await getTeamShortID(2019)
            expect(teams[0]).to.eql("atl")
            expect(teams[teams.length - 1]).to.eql("wsh")

        });
    });
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
        it("", async () => {
            const teams = await getPlayerIds(2019);
            const stillers = teams.find((t) => {
                return t.id === 'pittsburgh-steelers';
            });

            expect(stillers).to.be.ok;
            expect(stillers.name).to.eql('Pittsburgh Steelers');
        });
    });
    describe('getTeamSchedules', async () => {
        it("", async () => {
            const games = await getTeamSchedules('ari', 2019);
            const game = games[0];
            expect(game.id).to.eql('401127999');
            expect(game.homeTeam).to.eql('ari');
            expect(game.awayTeam).to.eql('det');
        });
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

