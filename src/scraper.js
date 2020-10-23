import axios from 'axios';
import cheerio from 'cheerio';
import URL from 'url';
import fs from 'fs';

const PLAYER_STAT_PAGE = 'https://www.espn.com/nfl/player/gamelog/_/id/{playerId}/type/nfl/year/{year}';
const SEASON_PASSING_STATS = 'https://www.espn.com/nfl/stats/player/_/season/{year}/seasontype/2/table/passing/sort/passingYards/dir/desc';
const CURRENT_PASSING_STATS = 'https://www.espn.com/nfl/stats/player/_/table/passing/sort/passingYards/dir/desc';

const buildUrl = function (url, replacements) {
    const reFind = /\{([^\}]+)\}/g

    return url.replace(reFind, (match, found) => {
        return replacements[found];

        
    });
} 

const getPayerIds = async (year = 2019) => {
    const url = buildUrl(SEASON_PASSING_STATS, {year});
    return axios({
        method: 'GET',
        url
    })
        .then((response) => {
            const $ = cheerio.load(response.data);
            let urls = []
            const last = 41;
            for (let i = 1; i <= last; i += 1) {
                const pllink = $(`#fittPageContainer > div.page-container.cf > div > div > section > div > div:nth-child(4) > div > div.flex > table > tbody > tr:nth-child(${i}) > td:nth-child(2) > div > a`);
                pllink.each((i, anchor) => {
                    let parsed = URL.parse(anchor.attribs.href);
                    let parts = parsed.path.split('/');
                    urls.push(parts[5]);
                });
            }
            
            return urls;
        });
}

const getYearStatSummary = async function (playerId, year) {

    const url = buildUrl(PLAYER_STAT_PAGE, {playerId, year});

    const response = await axios({
        method: 'GET',
        url
    });

    const $ = cheerio.load(response.data);
    const tblHeading = [
        'date',
        'opponent',
        'game_result',
        'passing_completions',
        'passing_attempts',
        'passing_yards',
        'passing_completion_percent',
        'seasonAvgPassYardsPG',
        'passing_touchdowns',
        'passing_interceptions',
        'passing_longest',
        'total_sacks',
        'rating',
        'adjusted_rating',
        'rushing_attempts',
        'rushing_yards',
        'rushing_avg_yards',
        'rushing_touchdowns',
        'longest_rush'
    ];

    const nameSelector = '#fittPageContainer > div.StickyContainer > div.ResponsiveWrapper > div > div > div.PlayerHeader__Left.flex.items-center.justify-start.overflow-hidden.brdr-clr-gray-09 > div.PlayerHeader__Main.flex.items-center > div.PlayerHeader__Main_Aside.min-w-0.flex-grow.flex-basis-0 > h1 > span:nth-child(2)'
    const selector = '#fittPageContainer > div.StickyContainer > div:nth-child(5) > div > div.PageLayout__Main > div.ResponsiveWrapper > div > div > div > div > div > div > div > div.Table__Scroller > table > tbody';            
    const tables = $(selector);
    const playerName = $(nameSelector).text().trim();

    let data = {
        playerId,
        year,
        stats: [],
        playerName,
        seasonAvgPassYardsPG: 0,
    };

    $(tables[tables.length - 1]).each((idx, table) => {
        $(table).find('tr').each((j, tr) => {
            let statLine = {};
            if ($(tr).hasClass('totals_row')) {
                return;
            }
            $(tr).find("td").each((i, d) => {
                statLine[tblHeading[i]] = $(d).text();
            });
            data.stats.push(statLine);
        })
    });

    let totalYards = data.stats.reduce((total, game) => {
        total += parseInt(game.passing_yards, 10);
        return total;
    }, 0);

    data.seasonAvgPassYardsPG = totalYards / data.stats.length;
    
    return data;
}


// Test
import chai from 'chai';
const expect = chai.expect;

describe('Scraper', () => {
    describe('getYearStatSummary', () => {
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
    describe('buildUrl', () => {
        it('replaces year and id', () => {
            let a = buildUrl("https://{playerId}/something/{year}", {playerId: 1000, year: 2023});

            expect(a).to.eql("https://1000/something/2023")
        });
    });
    describe('All Players', () => {
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
                    console.log('problem with: ' + buildUrl(PLAYER_STAT_PAGE, {playerId: d.playerId, year: d.year}));
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
                    console.log('problem with:' + buildUrl(PLAYER_STAT_PAGE, {playerId: d.playerId, year: d.year}));
                }
            });
        })
    });

});

