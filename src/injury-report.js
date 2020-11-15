import { getAxiosInstance, getLinkIndexAsInt } from './utils.js';
import cheerio from 'cheerio';

const axios = getAxiosInstance();
export const getReport = async () => {
    let url = 'https://www.espn.com/nfl/injuries';

    let report = await axios.get(url);
    let $ = cheerio.load(report.data);
    let injuryRowSelector = '.ResponsiveTable .flex tbody > tr';
    let rows = $(injuryRowSelector);
    let players = rows.map((i, row) => {
        let playerLink = $(row).find('td:nth-child(1) a');
        let playerUrl = playerLink.attr('href');
        let pos = $(row).find('td.col-pos').text().trim();
        let status = $(row).find('td.col-stat').text().trim();
        let desc = $(row).find('.col-desc').text().trim();
        let r = {
            id: getLinkIndexAsInt(playerUrl, 7),
            pos, status, desc,
        };
        return r; 
    });
    return players;
};