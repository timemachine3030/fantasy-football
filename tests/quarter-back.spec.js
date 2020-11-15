/*globals describe, it, beforeEach */
import QuarterBack from '../src/quarter-back.js';
import {buildUrl} from '../src/utils.js';
import chai from 'chai';
const expect = chai.expect;


describe('Scraper', () => {
    describe('predict 2020 stats', () => {
        let wilson = new QuarterBack('14881');
        beforeEach(async () => {
            await wilson.populateYearStatSummary(2020);
        });
        it('get Wilson stats 2020', async () => {
            const wilsonNow = await wilson.predictStats(2020);
            expect(wilsonNow.gameYards).to.be.an('array');
            expect(wilsonNow.alpha).to.be.an('number');
        });
    });
    describe('populateYearStatSummary', () => {
        it('find Lamar reg season', async () => {
            let y = 2019;
            let qb = new QuarterBack('3916387');
            await qb.populateYearStatSummary(y);
            expect(qb.playerId).to.eql('3916387');
            expect(qb.years[y]).to.be.ok;
            expect(qb.years[y].stats).to.be.an('array');
            expect(qb.years[y].stats[0].opponent).to.eql('@CLE');
            expect(qb.playerName).to.eql('Jackson');
        });
        it('find Dak reg season', async () => {
            let qb = new QuarterBack('2577417');
            let y = 2019;
            await qb.populateYearStatSummary(y);
            expect(qb.playerId).to.eql('2577417');
            expect(qb.years[y].stats).to.be.an('array');
            expect(qb.years[y].stats[0].opponent).to.eql('vsWSH');
            expect(qb.years[y].stats.length).to.eql(16);
        });
    });
    describe('buildUrl', () => {
        it('replaces year and id', () => {
            let a = buildUrl('https://{playerId}/something/{year}', {playerId: 1000, year: 2023});
            expect(a).to.eql('https://1000/something/2023');
        });
    });
});

