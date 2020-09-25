const axios = require('axios');
const cheerio = require('cheerio');

const getUrl = function (playerId, year, url) {
    return axios({
        method: 'GET',
        url
    })
        .then((response) => {
            const $ = cheerio.load(response.data);
            const tblHeading = [
                'date',
                'opponent',
                'game_result',
                'passing_completions',
                'passing_attempts',
                'passing_yards',
                'passing_completion_percent',
                'passing_avg_yards',
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
            const rows = $('table').get(1).find('tbody tr');
            let data = {
                playerId,
                year,
            };
            rows.map((i, row) => {
                row.children.map((col, idx) => {
                    data[tblHeading[idx]] = $(row).text();
                });
            });
            return data;
        });
}

module.exports = Object.freeze({
    getUrl
});

// Test
const {expect} = require('chai');

describe('Scraper', () => {
    describe('getUrl', () => {
        it('returns a promise', () => {
            return getUrl('3916387', '2019', 'https://www.espn.com/nfl/player/gamelog/_/id/3916387/type/nfl/year/2019')
            .then((result) => {
                console.log(result);
                // expect(result).to.be.an('array');
            })
        });
    });
});

