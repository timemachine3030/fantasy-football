import { getAxiosInstance, getLinkIndexAsInt } from './utils.js';
// import cheerio from 'cheerio';
import fs from 'fs';

const axios = getAxiosInstance();
export const getReport = async () => {
    let url = 'https://www.espn.com/nfl/injuries';

    let report = await axios.get(url);
    let match = report.data.match(/window.'__espnfitt__'.=(.+);<\/script/);
    let data = JSON.parse(match[1]);
    
    let injuries = data.page.content.injuries.reduce((total, team) => {
        let match = team.logo.match(/500\/([a-z]{2,3}).png/);
        let shortid = match[1];
        return total.concat(team.items.map(report => {
            let player = {
                name: report.athlete.name,
                id: getLinkIndexAsInt(report.athlete.href, 7),
                team: shortid.toLowerCase(),
                status: report.statusDesc.toLowerCase(),
                pos: report.athlete.position.toLowerCase(),
                desc: report.description,
            };
            return player;
        }));
    }, []);
    fs.writeFileSync('./datafiles/injury-report.json', JSON.stringify(injuries, null, 2));
    return injuries;
};