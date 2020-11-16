import cheerio from 'cheerio';
import URL from 'url';
import {alphaFromHistory, betaFromHistory} from './distribution.js';
import {buildUrl, getAxiosInstance} from './utils.js';

const axios = getAxiosInstance();

const PLAYER_STAT_PAGE = 'https://www.espn.com/nfl/player/gamelog/_/id/{playerId}/type/nfl/year/{year}';
const SEASON_PASSING_STATS = 'https://www.espn.com/nfl/stats/player/_/season/{year}/seasontype/2/table/passing/sort/passingYards/dir/desc';
// const CURRENT_PASSING_STATS = 'https://www.espn.com/nfl/stats/player/_/table/passing/sort/passingYards/dir/desc';

export default class QuarterBack {
    constructor(playerId) {
        this.playerId = playerId;
        this.years = [];
    }

    /**
     * @param {number} year
     * @returns {Promise<Array<string>>}
     */
    static getPayerIds(year = 2019) {
         const url = buildUrl(SEASON_PASSING_STATS, {year});
         return axios({
             method: 'GET',
             url
            })
            .then((response) => {
                const $ = cheerio.load(response.data);
                let playerIds = [];
                const last = 41;
                for (let i = 1; i <= last; i += 1) {
                    const pllink = $(`#fittPageContainer > div.page-container.cf > div > div > section > div > div:nth-child(4) > div > div.flex > table > tbody > tr:nth-child(${i}) > td:nth-child(2) > div > a`);
                    pllink.each((i, anchor) => {
                        let parsed = URL.parse(anchor.attribs.href);
                        let parts = parsed.path.split('/');
                        playerIds.push(parts[5]);
                    });
                }
                
                return playerIds;
            });
        }
    
    /**
     * 
     * @param {number} year: number
     * @returns {Promise<void>}
     */
    async populateYearStatSummary(year) {
        const url = buildUrl(PLAYER_STAT_PAGE, {playerId: this.playerId, year});
        
        const response = await axios({
            method: 'GET',
            url
        });
        
        const $ = cheerio.load(response.data);
        const tblTypes = {
            'date': 'string',
            'opponent': 'string',
            'game_result': 'string',
            'passing_completions': 'number',
            'passing_attempts': 'number',
            'passing_yards': 'number',
            'passing_completion_percent': 'number',
            'seasonAvgPassYardsPG': 'number',
            'passing_touchdowns': 'number',
            'passing_interceptions': 'number',
            'passing_longest': 'number',
            'total_sacks': 'number',
            'rating': 'number',
            'adjusted_rating': 'number',
            'rushing_attempts': 'number',
            'rushing_yards': 'number',
            'rushing_avg_yards': 'number',
            'rushing_touchdowns': 'number',
            'longest_rush': 'number'
        };
        const tblHeading = Object.keys(tblTypes);
        
        const nameSelector = '#fittPageContainer > div.StickyContainer > div.ResponsiveWrapper > div > div > div.PlayerHeader__Left.flex.items-center.justify-start.overflow-hidden.brdr-clr-gray-09 > div.PlayerHeader__Main.flex.items-center > div.PlayerHeader__Main_Aside.min-w-0.flex-grow.flex-basis-0 > h1 > span:nth-child(2)';
        const selector = '#fittPageContainer > div.StickyContainer > div:nth-child(5) > div > div.PageLayout__Main > div.ResponsiveWrapper > div > div > div > div > div > div > div > div.Table__Scroller > table > tbody';            
        const tables = $(selector);
        this.playerName = $(nameSelector).text().trim();
        
        let data = {
            stats: [],
            seasonAvgPassYardsPG: 0,
        };
        
        $(tables[tables.length - 1]).each((idx, table) => {
            $(table).find('tr').each((j, tr) => {
                let statLine = {};
                if ($(tr).hasClass('totals_row')) {
                    return;
                }
                $(tr).find('td').each((i, d) => {
                    let val = $(d).text();
                    if (tblTypes[tblHeading[i]] === 'number') {
                        val = parseFloat(val);
                    }
                    statLine[tblHeading[i]] = val;
                });
                data.stats.push(statLine);
            });
        });
        
        let totalYards = data.stats.reduce((total, game) => {
            total += game.passing_yards;
            return total;
        }, 0);
        
        data.seasonAvgPassYardsPG = totalYards / data.stats.length;
        
        this.years[year] = data;
    }
    /**
     * 
     * @param {number} year
     * @returns Promise<{}> 
     */
    predictStats(year) {
        if (!this.years[year]) {
            throw new Error('Must populate year stats: ' + year);
        }
        const product = {
            gameYards: [],
            alpha: 0,
            beta: 0,
        };
        let i=0;
        this.years[year].stats.forEach(() => {
            product.gameYards[i] = this.years[year].stats[i].passing_yards;
            i += 1;
            
        });
        this.datapoints = product.gameYards.length;
        product.alpha = alphaFromHistory(product.gameYards);
        product.beta = betaFromHistory(product.gameYards);
        
        return product; 
    }


    passingStats() {
        let pass_yds = this.sumAll('passing_yards');
        let pass_td  = this.sumAll('passing_touchdowns');
        let pass_att = this.sumAll('passing_attempts');
        let pass_cmp = this.sumAll('passing_completions');
        let pass_int = this.sumAll('passing_interceptions');

        return {pass_yds, pass_td, pass_att, pass_cmp, pass_int};
    }
    /**
     * https://en.wikipedia.org/wiki/Passer_rating
     * https://www.pro-football-reference.com/about/qb-rating.htm
     * 
     * @param {PassingStats} s
     * @returns {number} the QBR for this player.
     */
    calculateRating(s) {
        
        // Validate:
        if (s.pass_cmp > s.pass_att) {
            throw new Error('Completions cannot exceed attempts, please try again.');
        } else if (s.pass_td > s.pass_att) {
            throw new Error('Touchdowns cannot exceed attempts, please try again.');
        } else if (s.pass_td > s.pass_cmp) {
            throw new Error('Touchdowns cannot exceed completions, please try again.');
        } else if (s.pass_int > s.pass_att) {
            throw new Error('Interceptions cannot exceed attempts, please try again.');
        } 

        const MAX_RATING = 2.375;
        const MIN_RATING = 0;

        // Force a value to be between MIN_RATING and MAX_RATING
        function clamp(v) {
            return Math.max(MIN_RATING, Math.min(MAX_RATING, v));
        }
        
        let a = clamp(((s.pass_cmp / s.pass_att) - 0.3) * 5);
        let b = clamp(((s.pass_yds / s.pass_att) - 3) * .25);
        let c = clamp((s.pass_td / s.pass_att) * 20);
        let d = clamp(MAX_RATING - ((s.pass_int / s.pass_att) * 25));
        let rating = (a + b + c + d) / 6 * 100;
        return Math.round(rating * 100) / 100;
    }

    /**
     * 
     * @param {string} stat The player stat to sum.
     * @returns {number}
     */
    sumAll(stat) {
        return this.years.reduce((total, year) => {
            return total += year.stats.reduce((t, game) => t += game[stat], 0);
        }, 0);
    }
}