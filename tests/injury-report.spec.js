import {getReport} from '../src/injury-report.js';

describe('getReport', () => {
    it('finds all rows', async () => {
        return await getReport();
    });
});