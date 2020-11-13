import {buildUrl} from './utils.js';
import http from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import rateLimit from 'axios-rate-limit';

const axios = rateLimit(http.create(), {
    maxRPS: 4
});
const RESULTS_PAGE = 'https://www.espn.com/nfl/schedule/_/week/{week}';

export const getAllResults = async function (week) {
    const url = buildUrl(RESULTS_PAGE, {week});
    let gameListing = await axios({
        method: 'GET',
        url,
    });

    let $gl = cheerio.load(gameListing.data);
    let results = [];
    // #sched-container > div:nth-child(3)
    // #sched-container > div:nth-child(7) > table > tbody > tr > td:nth-child(3) > a
    // #sched-container > div:nth-child(7) > table > tbody > tr > td:nth-child(3) > a
    // #sched-container > div:nth-child(5) > table > tbody > tr:nth-child(1) > td:nth-child(3) > a
    let t2 = Array.from({length: 12}, (x, i) => [5, i + 1]);
    
    let idx = [
        [3, 1],
        ...t2,
        [7, 1]
    ];

    for (let i of idx) {

        let gameSelector = `#sched-container > div:nth-child(${i[0]}) > table> tbody > tr:nth-child(${i[1]}) > td:nth-child(3) > a`;
        
        let gameUrl = $gl(gameSelector).attr('href');
        if (!gameUrl) {
            continue;
        }

        let gamePage = await axios({
            method: 'GET',
            url: 'https://www.espn.com' + gameUrl,
        });
        let $ = cheerio.load(gamePage.data);
        let homeQbYrds = $(`#gamepackage-team-leaders > article > div > div > div > div:nth-child(1) > div > div.away-leader > div > div.player-detail > span.player-stats`).text();
        let awayQbYrds = $(`#gamepackage-team-leaders > article > div > div > div > div:nth-child(1) > div > div.home-leader > div > div.player-detail > span.player-stats`).text();
        let result = {
            home: parseStatLine(homeQbYrds),
            away: parseStatLine(awayQbYrds),
        };

        results.push(result);
    }

    return results;


}

export const parseStatLine = function (txt) {
    let reStatLine = /([^,]+,\s*)(\d+)\sYDS.*/;
    let match = txt.match(reStatLine);
    if (match) {
        return parseInt(match[2], 10);
    } 

    throw new Error('Regex bug (' + JSON.stringify(txt) + ')');
}