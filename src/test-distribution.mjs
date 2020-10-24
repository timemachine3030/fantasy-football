import chai from 'chai';
import {compute} from './distribution.mjs';

const expect = chai.expect;



describe('compute gamma', () => {
    it('cdf', () => {
        const cfd = compute(1, 2, 4);
        expect(cfd).to.eql(0.04462);

    });
});