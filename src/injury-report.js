import {getAxiosInstance, playerIdFromLink} from './utils.js';
import cheerio from 'cheerio';

const axios = getAxiosInstance();
export const getReport = async () => {
    let url = 'https://www.espn.com/nfl/injuries'

    let report = await axios.get(url);
    let $ = cheerio.load(report.data);
    let injuryRowSelector = `.ResponsiveTable .flex tr`;
    let rows = $(injuryRowSelector)
    let players = [];
    for (let row of rows) {
        let playerLink = $(row).find('.AnchorLink').attr('href');
        let pos = $(row).find('.col-pos').text().trim();
        let status = $(row).find('.col-stat').test().trim();
        let desc = $(row).find('.col-desc').test().trim();
        players.push({
            id: getLinkIndexAsInt(playerLink, 5),
            pos, status, desc,
        });~
    }
    return players;
};