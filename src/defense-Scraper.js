/*globals process */
/*
Produce a JSON object
year -> [teamid -> gameid:{
    opponent:
    defensive stats:
}] 
*/

import cheerio from 'cheerio';
import fs from 'fs';
import { alphaFromHistory, betaFromHistory } from './distribution.js';
import { getAxiosInstance } from './utils.js';

const axios = getAxiosInstance();
const TEAM_SEASON = 'https://www.espn.com/nfl/team/schedule/_/name/{shortid}/season/{year}';
const GAME_BOX_SCORE = 'https://www.espn.com/nfl/boxscore?gameId={gameID}';

const buildUrl = function (url, replacements) {
    const reFind = /\{([^}]+)}/g;

    return url.replace(reFind, (match, found) => {
        return replacements[found];


    });
};
export const buildDataModel = async function (season) {
    let scores = {};
    for (let i = 0; i < season.length; i++) {
        if (i % 64 === 0) {
            process.stdout.write('\n');
        }
        let id = season[i].id;
        if (!scores[id]) {
            scores[id] = season[i];
            scores[id].score = await getGameScore(id);
            process.stdout.write('f');
        } else {
            process.stdout.write('c');
        }
    }
    // TO DO: plug in away team scores
    return scores;
};
export const getGameScore = async function (gameID) {
    const gameScore = buildUrl(GAME_BOX_SCORE, { gameID });
    const response = await axios({
        method: 'GET',
        url: gameScore,
    });
    const $ = cheerio.load(response.data);
    const basicStatSelector = '#gamepackage-{type} > div > .gamepackage-{otherTeam}-wrap > div > div > table > tbody > tr.highlight > td.{collumn}';
    let statSelector = buildUrl(basicStatSelector, {
        type: 'passing',
        otherTeam: 'away',
        collumn: 'yds',

    });
    const awayPassingyards = $(statSelector).text();
    statSelector = buildUrl(basicStatSelector, {
        type: 'rushing',
        otherTeam: 'away',
        collumn: 'yds',

    });
    // const awayRushingingyards = $(statSelector).text();

    statSelector = buildUrl(basicStatSelector, {
        type: 'passing',
        otherTeam: 'home',
        collumn: 'yds',

    });
    const homePassingyards = $(statSelector).text();
    statSelector = buildUrl(basicStatSelector, {
        type: 'rushing',
        otherTeam: 'home',
        collumn: 'yds',

    });
    // const homeRushingingyards = $(statSelector).text();
    const defensiveStats = {
        homeTeam: parseInt(awayPassingyards, 10), // + parseInt(awayRushingingyards, 10),
        awayTeam: parseInt(homePassingyards, 10),  // + parseInt(homeRushingingyards, 10),
    };
    return defensiveStats;
};

async function getTeamShortID(year) {
    const url = buildUrl(TEAM_SEASON, { shortid: 'ari', year });
    const response = await axios({
        method: 'GET',
        url
    });
    const $ = cheerio.load(response.data);
    const options = '#fittPageContainer > div.StickyContainer > div.page-container.cf > div > div.layout__column.layout__column--1 > section > div > section > div.flex.justify-between.mt3.mb3.items-center > div > select:nth-child(2) option';
    const teams = [];
    $(options).each((i, team) => {
        let shortid = $(team).data('param-value');
        if (shortid) {
            teams.push(shortid);
        }
    });
    return teams;
}
export async function getAllTeamsSchedules(year) {
    const teams = await getTeamShortID(year);
    let schedules = [];
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
        const rowLinks = $(row).find('a');
        const oppHref = $($(rowLinks).get(1)).attr('href');
        if (oppHref === undefined) {
            continue;
        }
        const gameOpp = {
            id: oppHref.split('/')[6],
            shortid: oppHref.split('/')[5],
        };
        const href = $($(rowLinks).get(2)).attr('href');
        const gameId = href.split('/').slice(-1)[0]; // http://www.espn.com/nfl/game/_/gameId/401131043
        const location = $(row).find('.opponent-logo .pr2:nth-child(1)').text();
        let homeTeam = gameOpp.shortid;
        let awayTeam = shortid;
        if (location === 'vs') {
            homeTeam = shortid;
            awayTeam = gameOpp.shortid;
        }
        games.push({
            id: gameId,
            homeTeam, awayTeam

        });
    }

    return games;
}

export function getDefGames(shortid) {
    const defBuf = fs.readFileSync('./season-defense.json', 'utf-8');
    const season = JSON.parse(defBuf);
    let games = Object.values(season);
    return games.filter((game) => {
        if (game.homeTeam === shortid || game.awayTeam === shortid) {
            return true;
        }
    });
}

export function getDefAvg(shortid) {

    const defBuf = fs.readFileSync('./season-defense.json', 'utf-8');
    const season = JSON.parse(defBuf);
    let games = Object.values(season);
    const teamGames = games.filter((game) => {
        if (game.homeTeam === shortid || game.awayTeam === shortid) {
            return true;
        }
    });

    const totalDefYrds = teamGames.reduce((total, game) => {
        if (game.awayTeam === shortid) {
            total += game.score.awayTeam;
        }
        if (game.homeTeam === shortid) {
            total += game.score.homeTeam;
        }
        return total;
    }, 0);

    const avgDefYrdsAgainst = totalDefYrds / teamGames.length;

    return { avgDefYrdsAgainst, games: teamGames };
}

export function getQbAvg(name) {
    const qbBuf = fs.readFileSync('./qb-data.json', 'utf-8');
    const qbdata = JSON.parse(qbBuf);
    const qb = qbdata.find((q) => q.playerName === name);
    return qb;
}

/*
Possible changes:
Factor in time of possession
Factor in standard deviation(yards)
Factor in defense type
Weather
Score
TOP
*/
//Total yards is an erlang distribution with k plays and theta mathematical yards per play

export const predictDefenseStats = (shortid, games) => {
    if (!games) throw new Error('games are required.');
    const product = {
        gameYards: [],
        alpha: 0,
        beta: 0,
    };
    product.gameYards = games.map(game => {
        if (game.awayTeam === shortid) {
            return game.score.awayTeam;
        } else {
            return game.score.homeTeam;
        }
    });

    product.alpha = alphaFromHistory(product.gameYards);
    product.beta = betaFromHistory(product.gameYards);

    return product;
};