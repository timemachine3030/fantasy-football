/*globals describe, it */
import QuarterBack from './quarter-back.js';
import { getDefGames, predictDefenseStats } from '../src/defense-Scraper.js';
import fs from 'fs';
import chai from 'chai';
import { getAllResults, getAllGames } from '../src/results.js';
import { compute } from './distribution.js';
const expect = chai.expect;
let NFL = {
    ari: ['2577189', '3917315'],
    atl: ['11237', '5615'],
    bal: ['14875', '3916387'],
    buf: ['3918298', '15948'],
    car: ['16728', '3115252'],
    chi: ['16252', '14877'],
    cin: ['3915511', '3042876'],
    cle: ['15168'],
    dal: ['3895785', '16809'],
    den: ['2574630', '3924327'],
    det: ['3116188', '12471'],
    gb: ['8439', '3045169'],
    hou: ['3122840', '16810'],
    ind: ['5529', '2578570', '4035003'],
    jax: ['4038524', '3124900'],
    kc: ['3139477', '11291'],
    lv: ['16757', '2576980', '2972236'],
    lac: ['4038941', '14163'],
    lar: ['3046779'],
    mia: ['8664', '4241479'],
    min: ['14880', '2517017'],
    ne: ['13994', '12477', '3892775'],
    no: ['2580', '2468609'],
    nyg: ['3917792', '13199'],
    nyj: ['11252', '3912547', '3914395'],
    phi: ['2573079', '4040715',],
    pit: ['5536', '3044720',],
    sf: ['3059989', '2979520'],
    sea: ['14881', '15864'],
    tb: ['2330', '16140'],
    ten: ['14876',],
    wsh: ['4040616', '3115293'],
};

async function runWeek(week) {
    let str = week.toString().padStart(2, '0');
    let files = {
        prediction: `./datafiles/week-${str}.json`,
        results: `./datafiles/week-${str}-results.json`,
    };
    let prediction = await runWeekPregictions(week);
    fs.writeFileSync(files.prediction, JSON.stringify(prediction, null, 2));
    let results = await getAllResults(week);
    let difference = prediction.map((matchup) => {
        let result = results.find(g => g.game === matchup.game.id);
        if (result) {
            if (matchup.home.alpha && matchup.home.beta) {
                matchup.home.gamma = compute(result.home.yards, matchup.home.alpha, matchup.home.beta);
                matchup.home.actual = result.home;
            }
            if (matchup.away.alpha && matchup.away.beta) {
                matchup.away.gamma = compute(result.away.yards, matchup.away.alpha, matchup.away.beta);
                matchup.away.actual = result.away;
            }
        }
        return matchup;
    });
    fs.writeFileSync(files.results, JSON.stringify(difference, null, 2));
}

describe('week-11', () => {
    it('', async () => {
        await runWeek(11);
        expect(true).to.be.ok;
    });
});
describe('predict', () => {

    describe('week-09', () => {

        it('compares-all-teams', async () => {
            let results = await runWeekPregictions(9);
            fs.writeFileSync('./datafiles/week-09-rerun.json', JSON.stringify(results, null, 2));
        });
    });

    describe('week-10', () => {
        it('compares-all-teams', async () => {
            let results = await runWeekPregictions(10);
            expect(results.length).eql(14);
            fs.writeFileSync('./datafiles/week-10.json', JSON.stringify(results, null, 2));
        });
    });

});

describe('results', () => {
    it('week-09', async () => {
        let results = await getAllResults(9);
        let prediction = JSON.parse(fs.readFileSync('./datafiles/week-09-rerun.json', 'utf-8'));
        let difference = prediction.map((matchup) => {
            let result = results.find(g => g.game === matchup.game.id);
            if (result) {
                if (matchup.home.alpha && matchup.home.beta) {
                    matchup.home.gamma = compute(result.home.yards, matchup.home.alpha, matchup.home.beta);
                    matchup.home.actual = result.home;
                }
                if (matchup.away.alpha && matchup.away.beta) {
                    matchup.away.gamma = compute(result.away.yards, matchup.away.alpha, matchup.away.beta);
                    matchup.away.actual = result.away;
                }
            }
            return matchup;
        });
        fs.writeFileSync('./datafiles/week-09-with-gama.json', JSON.stringify(difference, null, 2));
    });

    it('week-10', async () => {
        let results = await getAllResults(10);
        let prediction = JSON.parse(fs.readFileSync('./datafiles/week-10.json', 'utf-8'));
        let difference = prediction.map((matchup) => {
            let result = results.find(g => g.game === matchup.game.id);
            if (result) {
                if (matchup.home.alpha && matchup.home.beta) {
                    matchup.home.gamma = compute(result.home.yards, matchup.home.alpha, matchup.home.beta);
                    matchup.home.actual = result.home;
                }
                if (matchup.away.alpha && matchup.away.beta) {
                    matchup.away.gamma = compute(result.away.yards, matchup.away.alpha, matchup.away.beta);
                    matchup.away.actual = result.away;
                }
            }
            return matchup;
        });
        fs.writeFileSync('./datafiles/week-10-with-gama.json', JSON.stringify(difference, null, 2));
    });
});


const runWeekPregictions = async (week) => {
    let matchups = await getAllGames(week);
    return Promise.all(matchups.map(async (game) => {
        let qb_home = new QuarterBack(NFL[game.home][0]);
        let qb_away = new QuarterBack(NFL[game.away][0]);
        let prediction1 = await compareTeams(qb_home, game.away);
        let prediction2 = await compareTeams(qb_away, game.home);
        return {
            game,
            home: {
                datapoints: qb_home.datapoints,
                qb: qb_home.playerName,
                def: game.away,
                ...prediction1
            },
            away: {
                datapoints: qb_away.datapoints,
                qb: qb_away.playerName,
                def: game.home,
                ...prediction2
            }
        };
    }));
};

export const compareTeams = async function compareTeams(qb, def) {
    let games = getDefGames(def);
    let defenseDistribution = predictDefenseStats(def, games);
    await qb.populateYearStatSummary(2019);

    let qbDistribution = qb.predictStats(2019);

    let comparisionAlpha = (defenseDistribution.alpha + qbDistribution.alpha) / 2;

    let comparisionBeta = (defenseDistribution.beta + qbDistribution.beta) / 2;
    return {
        avg: comparisionBeta * comparisionAlpha,
        alpha: comparisionAlpha,
        beta: comparisionBeta
    };
};