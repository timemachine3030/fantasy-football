/*globals describe, it */
import { mean, alphaFromHistory, betaFromHistory, sigma, compute, round } from '../src/distribution.js';
import chai from 'chai';
const expect = chai.expect;

describe('compute gamma', () => {
    it('cdf', () => {
        const cfd = compute(1, 2, 4);
        expect(cfd).to.eql(0.0265);
    });
    it('compute from samples', () => {
        const sample = [18,16,13,32,22,16,28,37];
        const alpha = round(alphaFromHistory(sample));
        const beta = round(betaFromHistory(sample));
        const cfd = compute(12, alpha, beta);
        expect(cfd).to.eql(0.06702);
    });
});

describe('next game', () => {
    it('calculates mean', () => {
        const gameyds =[ 233, 169, 286, 245, 240, 200, 232, 378, 182, 241, 295, 268, 240, 406, 300, 195,];
        let meanYds = mean(gameyds);
        let alpha = alphaFromHistory(gameyds);
        let beta = betaFromHistory(gameyds);
        let avgYrd = (alpha * beta);
        let mode = (alpha - 1) * beta;
        expect(avgYrd).eql(meanYds);
        let modeProb = compute(mode, alpha, beta);
        let meanProb = compute(meanYds, alpha, beta);
        expect(round(meanProb + modeProb, 1)).eql(1);
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
            expect(round(
                sigma(3,5, i => i / (i + 1)),
                1000)
            ).to.eql(2.383);
        });
    });
    describe('mean', () => {
        describe('finds sample mean', () => {
            it('returns 0 if no input', () => {
                expect(mean([])).to.eql(0);
            });
            it('return the zeroth element if only one', () => {
                expect(mean([24])).to.eql(24);
            });
            it('calculated', () => {
                // https://www.wolframalpha.com/input/?i=find+the+sample+mean+of+18%2C16%2C13%2C32%2C22%2C16%2C28%2C37
                const sample = [18,16,13,32,22,16,28,37];
                expect(mean(sample)).to.eql(22.75);
            });
        });
    });
    describe('alpha', () => {
        it('returns the alpha for the data sample', () => {
            // https://www.wolframalpha.com/input/?i=+%28mean+%7B18%2C16%2C13%2C32%2C22%2C16%2C28%2C37%7D+%5E+2%29+%2F+%28%28mean+%7B18%5E2%2C16%5E2%2C13%5E2%2C32%5E2%2C22%5E2%2C16%5E2%2C28%5E2%2C37%5E2%7D%29+-+%28mean+%7B18%2C16%2C13%2C32%2C22%2C16%2C28%2C37%7D+%5E+2%29%29
            const sample = [18,16,13,32,22,16,28,37];
            const alpha = alphaFromHistory(sample);
            expect(round(alpha)).to.eql(7.87916);
        });
    });
    describe('beta', () => {
        it('returns the beta for a data sample', () => {
            // https://www.wolframalpha.com/input/?i=%28mean+%7B18%5E2%2C16%5E2%2C13%5E2%2C32%5E2%2C22%5E2%2C16%5E2%2C28%5E2%2C37%5E2%7D+-+%28mean+%7B18%2C16%2C13%2C32%2C22%2C16%2C28%2C37%7D+%5E+2%29%29+%2F+%28mean+%7B18%2C16%2C13%2C32%2C22%2C16%2C28%2C37%7D%29
            const sample = [18,16,13,32,22,16,28,37];
            const beta = betaFromHistory(sample);
            expect(round(beta)).to.eql(2.88736);
        });
    });
});
