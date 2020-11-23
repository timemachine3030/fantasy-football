import { getAxiosInstance, getLinkIndex, getLinkIndexAsInt } from './utils.js';
import cheerio from 'cheerio';
import fs from 'fs';

const axios = getAxiosInstance();
export const getReport = async () => {
    let url = 'https://www.espn.com/nfl/injuries';

    let report = await axios.get(url);
    let $ = cheerio.load(report.data);
    let injuryRowSelector = '.ResponsiveTable .flex tbody > tr';
    let rows = $(injuryRowSelector);
    let players = [];
    rows.map((i, row) => {
        let playerLink = $(row).find('td:nth-child(1) a');
        let playerUrl = playerLink.attr('href');
        let pos = $(row).find('td.col-pos').text().trim();
        let status = $(row).find('td.col-stat').text().trim();
        let desc = $(row).find('.col-desc').text().trim();
        let r = {
            id: getLinkIndexAsInt(playerUrl, 7),
            pos, status, desc, defense: false,
        };
        players.push(r); 
        players.forEach(element  => {
           if ((element.pos === 'S')||(element.pos === 'CB')||(element.pos === 'DE')||(element.pos === 'DT')||(element.pos === 'LB')){
               element.defense = true;
           } else {
               element.defense = false;
           }
        });
    });
    
    for (let player of players) {
        let result = await axios.get(player.playerUrl);
        let $ = cheerio.load(result.data);
        let teamLink = $('#fittPageContainer ul.PlayerHeader__Team_Info > li.truncate > a').attr('href');
        player.team = getLinkIndex(teamLink, 7);
    }
    fs.writeFileSync('./injuryReport.json', JSON.stringify(players, null, 2));
    return players;
};