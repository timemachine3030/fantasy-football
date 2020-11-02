import {predictStats, buildUrl, getYearStatSummary} from '../src/scraper.js';
import {alphaFromHistory, betaFromHistory} from '../src/distribution.js'
import chai from 'chai';
const expect = chai.expect;


describe('Scraper', () => {
    describe('predict 2020 stats', () => {
        it('get Wilson stats 2020', async () =>{
            const wilsonNow = await predictStats('14881', 2020)
            expect(wilsonNow.gameYards).to.be.an('array')
            expect(wilsonNow.alpha).to.be.an('number')
        })
    })
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
});

