/*globals describe, it */
import {getReport} from '../src/injury-report.js';

describe('getReport', () => {
    it('finds all rows', async () => {
        let injuries =  await getReport();
        console.log(injuries);
    });
});