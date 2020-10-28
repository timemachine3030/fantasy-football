import chai from 'chai';
import { sigma } from './distribution.mjs';
import { compute } from './distribution.mjs';

const expect = chai.expect;

describe('compute gamma', () => {
    it('cdf', () => {
        const cfd = compute(1, 2, 4);
        expect(cfd).to.eql(0.0265);

    });
});

describe('calculate', () => {
    describe('sigma', () => {
        it('basic', () => {
            expect(sigma(3,5)).to.eql(12);
        });
        it('additive', () =>{
            expect(sigma(3,5, i => i + 2)).to.eql(18);
        });
        it('multiplicative', () =>{
            expect(sigma(3,5, i => i * 2)).to.eql(24);
        });
        it('dividend', () =>{
            expect(Math.round(sigma(3,5, i => i / (i + 1)) * 1000) / 1000).to.eql(2.383);
        });
    });
    describe('alpha', () => {
        it('finds sample mean', () => {
            const sample = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const mean = sample.reduce((i) => {

            });
        })
    });
})
