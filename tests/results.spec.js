/*globals describe, it */
import {getAllResults, getGameIdFromUrl, parseStatLine} from '../src/results.js';

import chai from 'chai';
const expect = chai.expect;

describe('results', () => {
    describe('getAllResults', () => {
        it('', async () => {
            let results = await getAllResults(9);
            expect(results[0].home.yards).to.eql(305);
            expect(results[0].away.yards).to.eql(291);
            expect(results.length).eql(14);
        });
    });
    describe('parseStatLine', () => {
        it('find yrds', () => {
            let s = '25-31, 305 YDS, 4 TD';
            let r = parseStatLine(s);
            expect(r).to.be.a('number');
            expect(r).to.eql(305);
        });
    });
    describe('getGameIdFromUrl', () => {
        it('finds url', () => {
            expect(getGameIdFromUrl('/nfl/game/_/gameId/401220203')).eql(401220203);
        });
    });
});
