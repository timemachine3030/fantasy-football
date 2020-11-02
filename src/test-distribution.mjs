import chai from 'chai';
import { mean, alphaFromHistory, betaFromHistory, sigma, compute } from './distribution.mjs';

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
            expect(sigma(1,10)).to.eql(55);
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
    describe('mean', () => {
        describe('finds sample mean', () => {
            it('returns 0 if no input', () => {
                expect(mean([])).to.eql(0);
            })
            it('return the zeroth element if only one', () => {
                expect(mean([24])).to.eql(24);
            })
            it('returns the alpha for a data sample', () => {
                // https://www.wolframalpha.com/input/?i=find+the+sample+mean+of+18%2C16%2C13%2C32%2C22%2C16%2C28%2C37
                const sample = [18,16,13,32,22,16,28,37];
                expect(mean(sample)).to.eql(22.75);
            });
        })
    });
    describe('beta', () => {
        it('returns the beta for a data sample', () => {
            // https://www.wolframalpha.com/input/?i=%28mean+%7B18%5E2%2C16%5E2%2C13%5E2%2C32%5E2%2C22%5E2%2C16%5E2%2C28%5E2%2C37%5E2%7D+-+%28mean+%7B18%2C16%2C13%2C32%2C22%2C16%2C28%2C37%7D+%5E+2%29%29+%2F+%28mean+%7B18%2C16%2C13%2C32%2C22%2C16%2C28%2C37%7D%29
            const sample = [18,16,13,32,22,16,28,37];
            const beta = betaFromHistory(sample);
            expect(Math.round(beta * 100000) / 100000).to.eql(2.88736);
        });
    });
})
