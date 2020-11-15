import { getPayerIds, getYearStatSummary, predictStats } from '../src/scraper.js';
import {buildDataModel, getAllTeamsSchedules, getDefGames, predictDefenseStats} from '../src/defense-Scraper.js';
import { compareTeams } from '../src/loop.js';
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

    describe('game-scores ', () => {
        it('2019', async () => {
            const text = fs.readFileSync('./datafiles/schedules-data-2019.json', 'utf-8');
            const season = JSON.parse(text);
            const scores = await buildDataModel(season);
            const json = JSON.stringify(scores);
            fs.writeFileSync('./season-defense.json', json);
        });
    });
    describe('team-schedules', () => {
        it('2019', async () => {
            const schedules = await getAllTeamsSchedules(2019);
            const text = JSON.stringify(schedules, null, 2);
            fs.writeFileSync('./datafiles/schedules-data-2019.json', text);
        });
    });
    describe('compare-teams', () => {
        let teams = [{
            shortid: 'pit',
            qb: 5536
        }, {
            shortid: 'dal',
            qb: 2577417
        }];

        // console.log(comparision);
        it('avg the qb-alpha and def-alpha', async () => {
            let PitVsDak = await compareTeams(teams[0].shortid, teams[1].shortid);
            let DalVsBen = await compareTeams(teams[1].shortid, teams[0].shortid);
  
            console.log({PitVsDak, DalVsBen});
        });
    });

});