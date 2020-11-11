import QuarterBack from './quarter-back.js';
import { buildDataModel, getAllTeamsSchedules, getDefGames, predictDefenseStats } from '../src/defense-Scraper.js';
import fs from 'fs';
import chai from 'chai';
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
    gb:  ['8439', '3045169'],
    hou: ['3122840', '16810'],
    ind: ['2578570', '4035003', '5529'],
    jax: ['4038524', '3124900'],
    kc:  ['3139477', '11291'],
    lv:  ['16757', '2576980', '2972236'],
    lac: ['4038941', '14163'],
    lar: ['3046779'],
    mia: ['8664', '4241479'],
    min: ['14880', '2517017'],
    ne:  ['13994', '12477', '3892775'],
    no:  ['2580', '2468609'],
    nyg: ['3917792', '13199'],
    nyj: ['11252', '3912547', '3914395'],
    phi: ['2573079', '4040715', ],
    pit: ['5536', '3044720', ],
    sf:  ['3059989', '2979520'],
    sea: ['14881', '15864'],
    tb:  ['2330', '16140'],
    ten: ['14876', ],
    wsh: ['4040616', '3115293'],
}
let week10 = [{
    home: 'cle',
    away: 'hou',
}, {
    home: 'det',
    away: 'wsh',
}, {
    home: 'gb',
    away: 'jax',
}, {
    home: 'nyg',
    away: 'phi',
}, {
    home: 'ten',
    away: 'ind',
}, {
    home: 'car',
    away: 'tb',
}, {
    home: 'lv',
    away: 'den',
}, {
    home: 'mia',
    away: 'lac',
}, {
    home: 'ari',
    away: 'buf',
}, {
    home: 'lar',
    away: 'sea',
}, {
    home: 'ne',
    away: 'sf',
}, {
    home: 'pit',
    away: 'cin',
}, {
    home: 'ne',
    away: 'bal',
},{
    home: 'chi',
    away: 'min',

}];

let week09 = [{
    home: 'nyj',
    away: 'ne',
},{
    home: 'ari',
    away: 'mia',
    mia: 248,
    ari: 283,
}, {
    home: 'tb',
    away: 'no',
    no: 222,
    tb: 209,
}, {
    home: 'dal',
    away: 'pit',
    pit: 306,
    dal: 243,
}, {
    home: 'lac',
    away: 'lv',
    lac: 326,
    lv:  165
}, {
    home: 'jax',
    away: 'hou',
    hou: 281,
    jax: 304
}, {
    home: 'wsh',
    away: 'nyg',
    nyg: 212,
    wsh: 325,
}, {
    home: 'min',
    away: 'det',
    det: 211,
    min: 220,
},{
    home: 'kc',
    away: 'car',
    car: 310,
    kc:  372,
},{
    home: 'ind',
    away: 'bal',
    bal: 170,
    ind: 227
},{
    home: 'ten',
    away: 'chi',
    ten: 158,
    chi: 335,
},{
    home: 'buf',
    away: 'sea',
    sea: 390,
    buf: 415
},{
    home: 'atl',
    away: 'den',
    atl: 284,
    den: 313
},{
    home: 'gb',
    away: 'sf',
    gb: 305,
    sf: 291
}];

describe('week-09', () => {
    
    it('compares-all-teams', async () => {
        let results = await runWeekPregictions(week09);
        fs.writeFileSync('./datafiles/week-09-rerun.json', JSON.stringify(results, null, 2));
    });
});

describe('week-10', () => {
    it('has 14 games', () => {
        expect(week10.length).eql(14);
    });
    it('compares-all-teams', async () => {
        let results = await runWeekPregictions(week10);
        expect(results.length).eql(14);
        fs.writeFileSync('./datafiles/week-10.json', JSON.stringify(results, null, 2));
    });
});

const runWeekPregictions = async (matchups) => {
    return Promise.all(matchups.map(async (game) => {
        let qb_home = new QuarterBack(NFL[game.home][0]);
        let qb_away = new QuarterBack(NFL[game.away][0]);
        let prediction1 = await compareTeams(qb_home, game.away);
        let prediction2 = await compareTeams(qb_away, game.home);
        return {
            ...game,
            home: {
                qb: qb_home.playerName,
                def: game.away,
                ...prediction1
            },
            away: {
                qb: qb_away.playerName,
                def: game.home,
                ...prediction2
            }
        };
    }));
}

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
}