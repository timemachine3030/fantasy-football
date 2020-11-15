import {calculatePlayerPts, findKey, sumPlayerPts, sumAllPlayers, rankPlayers, getPlayer, passPts, touchdownPts, interceptionPts} from '../src/parser.js';
import fs from 'fs';
import chai from 'chai';
const expect = chai.expect;


const data = JSON.parse(fs.readFileSync('./qb-data.json'));

describe('parser', () => {
    let player = {
        'playerId': '2577417',
        'year': '2019',
        'stats': [
            {
                'date': 'Sun 12/29',
                'opponent': 'vsWSH',
                'game_result': 'W47-16',
                'passing_completions': '23',
                'passing_attempts': '33',
                'passing_yards': '303',
                'passing_completion_percent': '69.7',
                'passing_avg_yards': '9.2',
                'passing_touchdowns': '4',
                'passing_interceptions': '3',
                'passing_longest': '48',
                'total_sacks': '3',
                'rating': '138.0',
                'adjusted_rating': '65.9',
                'rushing_attempts': '3',
                'rushing_yards': '35',
                'rushing_avg_yards': '11.7',
                'rushing_touchdowns': '0',
                'longest_rush': '23',
                'undefined': '42'
            },
            {
                'date': 'Sun 12/29',
                'opponent': 'vsWSH',
                'game_result': 'W47-16',
                'passing_completions': '23',
                'passing_attempts': '33',
                'passing_yards': '303',
                'passing_completion_percent': '69.7',
                'passing_avg_yards': '9.2',
                'passing_touchdowns': '4',
                'passing_interceptions': '3',
                'passing_longest': '48',
                'total_sacks': '3',
                'rating': '138.0',
                'adjusted_rating': '65.9',
                'rushing_attempts': '3',
                'rushing_yards': '35',
                'rushing_avg_yards': '11.7',
                'rushing_touchdowns': '0',
                'longest_rush': '23',
                'undefined': '42'
            }
        ]
    };
    describe('findKey', () => {
        const completions = findKey(player, 'stats.1.passing_completions');
        expect(completions).to.eql('23');
    });
    describe('calculatePlayerPts', () => {
        calculatePlayerPts(player);

        expect(player.stats[0].touchdownPts).to.eql(16);
        expect(player.stats[0].interceptionPts).to.eql(-6);
        expect(player.stats[0].passingPts).to.eql(12);
    });
    describe('sumPlayerPts', () => {
        calculatePlayerPts(player);
        sumPlayerPts(player);
        expect(player.seasonPts).to.eql({
            touchdownPts: 32,
            interceptionPts: -12,
            passingPts: 24,
            totalPts: 44
        });
    });
    describe('rankPlayers', () => {
        const players = sumAllPlayers(data);
        const rankings = rankPlayers(players, 'seasonPts.touchdownPts');
        expect(rankings[0].playerName).to.eql('Jackson');
    });
    describe('pts from passing yrd', () => {
        it('Jameis Winston total points', () => {
            player = getPlayer('2969939');
            calculatePlayerPts(player);
            sumPlayerPts(player);
            expect(player.seasonPts.passingPts).to.equal(199);
        });
        
        it('Every 25 passing yards = 1 point', () => {
            expect(passPts(250)).to.eql(10);
        });
        
        it('Every touchdown = 4 points', () => {
            expect(touchdownPts(3)).to.eql(12);
        });
        it('Every interception = -2 points', () => {
            expect(interceptionPts(3)).to.eql(-6);
        });
    });
});