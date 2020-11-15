/*globals describe, it */
import {getReport} from '../src/injury-report.js';
import chai from 'chai';
const { expect } = chai;

describe('getReport', () => {
    it('finds all rows', async () => {
        let injuries =  await getReport();
        expect(injuries.length).greaterThan(0);
        expect(injuries[0].id).to.be.a('number');
        expect(injuries[0].status).ok;
        expect(injuries[0].desc).ok;
        expect(injuries[0].pos).ok;

    });
});