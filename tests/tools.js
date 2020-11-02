import { getPayerIds, getYearStatSummary } from '../src/scraper.js';
import fs from 'fs';
import chai from 'chai';
const expect = chai.expect;

describe('scripts', () => {
    it('qb-data', async () => {
        const ids = await getPayerIds(2019);

        const playerData = await Promise.all(ids.map((id) => {
            return getYearStatSummary(id, '2019');
        }));
        playerData.forEach((d) => {
            try {
                expect(d.stats).to.be.an('array');
                expect(d.stats.length).to.be.greaterThan(0);
            } catch (error) {
                console.error(error.message);
                console.log('problem with: ' + buildUrl(PLAYER_STAT_PAGE, {playerId: d.playerId, year: d.year}));
            }
        });
        expect(playerData).to.be.an('array');
        expect(playerData.length).to.eql(41);
        fs.writeFileSync('./datafiles/qb-data.json', JSON.stringify(playerData, null, 2));
    });
});