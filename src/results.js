import { buildUrl, getAxiosInstance } from './utils.js';
import cheerio from 'cheerio';

const axios = getAxiosInstance();
const RESULTS_PAGE = 'https://www.espn.com/nfl/schedule/_/week/{week}';

export const getAllGames = async function (week) {

    const url = buildUrl(RESULTS_PAGE, { week });
    let gameListing = await axios({
        method: 'GET',
        url,
    });

    let $gl = cheerio.load(gameListing.data);

    let t2 = Array.from({ length: 12 }, (x, i) => [5, i + 1]);

    let idx = [
        [3, 1],
        ...t2,
        [7, 1]
    ];

    let games = [];
    for (let i of idx) {

        
        let awaySel =      `#sched-container > div:nth-child(${i[0]}) > table > tbody > tr:nth-child(${i[1]}) > td:nth-child(1) > a`;
        let away = $gl(awaySel).attr('href');
        
        let homeSel =      `#sched-container > div:nth-child(${i[0]}) > table > tbody > tr:nth-child(${i[1]}) > td:nth-child(2) > div > a`;
        let home = $gl(homeSel).attr('href');
        
        let gameSelector = `#sched-container > div:nth-child(${i[0]}) > table > tbody > tr:nth-child(${i[1]}) > td:nth-child(3) > a`;
        let gameA = $gl(gameSelector);
        let gameUrl = 'https://www.espn.com' + gameA.attr('href');

        if (!gameUrl) {
            continue;
        }

        games.push({
            id: getGameIdFromUrl(gameUrl),
            gameUrl,
            home: getShortIdFromUrl(home),
            away: getShortIdFromUrl(away),
        });
    }
    return games;
};

export const getAllResults = async function (week) {
    let matchups = await getAllGames(week);
    let results = [];
    for (let game of matchups) {
        let gamePage = await axios({
            method: 'GET',
            url: game.gameUrl,
        });
        let $ = cheerio.load(gamePage.data);
        let awayQb = $('#gamepackage-team-leaders > article > div > div > div > div:nth-child(1) > div > div.away-leader > div > div.player-detail > span.player-name > a').attr('href');
        let homeQb = $('#gamepackage-team-leaders > article > div > div > div > div:nth-child(1) > div > div.home-leader > div > div.player-detail > span.player-name > a').attr('href');
        let homeQbYrds = $('#gamepackage-team-leaders > article > div > div > div > div:nth-child(1) > div > div.away-leader > div > div.player-detail > span.player-stats').text();
        let awayQbYrds = $('#gamepackage-team-leaders > article > div > div > div > div:nth-child(1) > div > div.home-leader > div > div.player-detail > span.player-stats').text();
        let result = {
            game: getGameIdFromUrl(game.gameUrl),
            home: {
                qb: homeQb,
                yards: parseStatLine(homeQbYrds),
            },
            away: {
                qb: awayQb,
                yards: parseStatLine(awayQbYrds),
            }
        };

        results.push(result);

    }
    return results;
};

// /nfl/team/_/name/atl/atlanta-falcons"
export const getShortIdFromUrl = (url) => {
    let segments = url.split('/');
    return segments[5];
};

// /nfl/game/_/gameId/401220203
export const getGameIdFromUrl = (url) => {
    let segments = url.split('/');
    return parseInt(segments[segments.length - 1], 10);
};

export const parseStatLine = function (txt) {
    let reStatLine = /([^,]+,\s*)(\d+)\sYDS.*/;
    let match = txt.match(reStatLine);
    if (match) {
        return parseInt(match[2], 10);
    }

    throw new Error('Regex bug (' + JSON.stringify(txt) + ')');
};