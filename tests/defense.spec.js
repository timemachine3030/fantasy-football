/*globals describe, it, beforeEach */
import {  getDefGames, predictDefenseStats } from '../src/defense-Scraper.js';
import chai from 'chai';
const expect = chai.expect;

// describe('Compare QB and Defense', () => {

    describe('predictDefenseStats', () => {
        let games;
        beforeEach(() => {
             games = getDefGames('pit');
        });
        it('predictDefensestats', () => {
            let result = predictDefenseStats('pit', games);
            expect(result.gameYards.length).to.eql(15); // TODO: Not getting the correct number of games!!
            expect(result.alpha).to.not.be.NaN;
            expect(result.beta).to.not.be.undefined;
        });
    });
    // it('Defense avg yards per game', () => {
    //     // Defense avg yds / game
    //     let shortid = 'ind';

    //     const picks = [
    //         ['Rivers', 333],
    //         ['Mariota', 154]
    //     ]
    //     let def = getDefAvg(shortid).avgDefYrdsAgainst;
    //     picks.forEach(([name, guess]) => {
    //         let qb = getQbAvg(name);
    //         let predi = (qb.seasonAvgPassYardsPG + def) / 2;
    //         let error = (predi - guess);
    //         console.log({
    //             guess,
    //             predi,
    //             error,
    //         }, 'Heads Up Stats');
    //     });
    // });
    // it('Pats Print Passing / Game', () => {
    //     const tom = getQbAvg('Brady');
    //     let yds = tom.stats.map((g) => {
    //         return parseInt(g.passing_yards, 10)
    //     });
    //     console.log('Tom Brady');
    //     console.log(tom.seasonAvgPassYardsPG);
    //     console.log(plot(yds, { height: 10 }));


    //     let shortid = 'mia';
    //     const mia = getDefAvg('mia');
    //     let def = mia.games.map((game) => {
    //         let passingAgainst;
    //         if (game.awayTeam === shortid) {
    //             passingAgainst = game.score.awayTeam;
    //         }
    //         if (game.homeTeam === shortid) {
    //             passingAgainst = game.score.homeTeam;
    //         }
    //         return passingAgainst;
    //     });
    //     console.log('mia');
    //     console.log(mia.avgDefYrdsAgainst);
    //     console.log(plot(def, { height: 10 }));
    // });

    // describe.skip('Defense Scraper', () => {

    //     describe('getTeamsShortID', () => {
    //         it('getsTeams', async () => {
    //             const teams = await getTeamShortID(2019)
    //             expect(teams[0]).to.eql("atl")
    //             expect(teams[teams.length - 1]).to.eql("wsh")

    //         });
    //     });
    //     describe('pathToTeamId', () => {
    //         it('returns the last part', () => {
    //             expect(linkToTeamId('nfl/team/_/name/ne/new-england-patriots')).to.eql('new-england-patriots');
    //         });
    //     });
    //     describe('getPageCache', () => {
    //         it('loads 3 pages', async () => {
    //             const pages = await getPageCache(2019);

    //             expect(pages.totalDefense.status).to.eql(200);
    //             expect(pages.passingDefense.status).to.eql(200);
    //             expect(pages.turnoverStats.status).to.eql(200);
    //         });
    //     });
    //     describe.skip('getPlayerIds', async () => {
    //         it("", async () => {
    //             const teams = await getPlayerIds(2019);
    //             const stillers = teams.find((t) => {
    //                 return t.id === 'pittsburgh-steelers';
    //             });

    //             expect(stillers).to.be.ok;
    //             expect(stillers.name).to.eql('Pittsburgh Steelers');
    //         });
    //     });
    //     describe('getTeamSchedules', async () => {
    //         it("", async () => {
    //             const games = await getTeamSchedules('ari', 2019);
    //             const game = games[0];
    //             expect(game.id).to.eql('401127999');
    //             expect(game.homeTeam).to.eql('ari');
    //             expect(game.awayTeam).to.eql('det');
    //         });
    //     });

    //     describe.skip('getYearStatSummary', () => {
    //         it('find Lamar reg season', async () => {
    //             const result = await getYearStatSummary('3916387', '2019');
    //             expect(result.playerId).to.eql('3916387');
    //             expect(result.year).to.eql('2019');
    //             expect(result.stats).to.be.an('array');
    //             expect(result.stats[0].opponent).to.eql('@CLE')
    //             expect(result.playerName).to.eql('Jackson')
    //         });
    //         it('find Dak reg season', async () => {
    //             const result = await getYearStatSummary('2577417', '2019');
    //             expect(result.playerId).to.eql('2577417');
    //             expect(result.year).to.eql('2019');
    //             expect(result.stats).to.be.an('array');
    //             expect(result.stats[0].opponent).to.eql('vsWSH')
    //             expect(result.stats.length).to.eql(16);
    //         });
    //     });
    //     describe('buildUrl', () => {
    //         it('replaces year and id', () => {
    //             let a = buildUrl("https://{playerId}/something/{year}", { playerId: 1000, year: 2023 });

    //             expect(a).to.eql("https://1000/something/2023")
    //         });
    //     });
    // });
// });