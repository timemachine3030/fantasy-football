import axios from 'axios';
import cheerio from 'cheerio';
import URL from 'url';
import fs from 'fs';

// Test
import chai from 'chai';
const expect = chai.expect;
/*

- QB
    - Every 25 passing yards = 1 point
    - TD pass = 4 points
    - Two point conversion = 2 points  // Ignore for now
    - Interception thrown = -2 points
    - Fumble Lost = -2 points // Ignore for now

- Passing Yards
    # Plays / game
    # of points / play


    https://www.espn.com/nfl/player/gamelog/_/id/{play_id}/type/nfl/year/{season_yr}

    */

const data = JSON.parse(fs.readFileSync('./qb-data.json'));

function calculatePlayerPts(player) {
    player.stats.forEach((game) => {
        game.passingPts = passPts(game.passing_yards);
        game.touchdownPts = touchdownPts(game.passing_touchdowns);
        game.interceptionPts = interceptionPts(game.passing_interceptions);
        
        game.totalPts = game.passingPts + game.touchdownPts + game.interceptionPts; // Sum above
    });
}
function sumPlayerPts(player) {
    player.seasonPts = player.stats.reduce((previous, game) => {
        previous.passingPts += game.passingPts;
        previous.touchdownPts += game.touchdownPts;
        previous.interceptionPts += game.interceptionPts;
        previous.totalPts += game.totalPts;
        return previous;
    }, {
        passingPts: 0,
        touchdownPts: 0,
        interceptionPts: 0,
        totalPts: 0
    });
}

function sumAllPlayers(playerData) {
    const players = playerData.map((p) => {
        calculatePlayerPts(p);
        sumPlayerPts(p)
        return p;
    });
    return players;
}

function rankPlayers(playerData, key) {
    return playerData.sort((a, b) => findKey(b, key) - findKey(a, key));
}

function findKey(o, path) {
    const paths = path.split('.');
    return paths.reduce((obj, p) => {
        return obj[p];
    }, o);
}


function getPlayer(id) {
    const data = JSON.parse(fs.readFileSync('./qb-data.json'));
    return data.find((player) => player.playerId === id);
}

function passPts(yards) {
    return Math.floor(yards / 25);
}
function touchdownPts(touchdowns) {
    return touchdowns * 4;
}
function interceptionPts(picks) {
    return picks * -2;
}


describe('parser', () => {
    let player = {
        "playerId": "2577417",
        "year": "2019",
        "stats": [
            {
                "date": "Sun 12/29",
                "opponent": "vsWSH",
                "game_result": "W47-16",
                "passing_completions": "23",
                "passing_attempts": "33",
                "passing_yards": "303",
                "passing_completion_percent": "69.7",
                "passing_avg_yards": "9.2",
                "passing_touchdowns": "4",
                "passing_interceptions": "3",
                "passing_longest": "48",
                "total_sacks": "3",
                "rating": "138.0",
                "adjusted_rating": "65.9",
                "rushing_attempts": "3",
                "rushing_yards": "35",
                "rushing_avg_yards": "11.7",
                "rushing_touchdowns": "0",
                "longest_rush": "23",
                "undefined": "42"
            },
            {
                "date": "Sun 12/29",
                "opponent": "vsWSH",
                "game_result": "W47-16",
                "passing_completions": "23",
                "passing_attempts": "33",
                "passing_yards": "303",
                "passing_completion_percent": "69.7",
                "passing_avg_yards": "9.2",
                "passing_touchdowns": "4",
                "passing_interceptions": "3",
                "passing_longest": "48",
                "total_sacks": "3",
                "rating": "138.0",
                "adjusted_rating": "65.9",
                "rushing_attempts": "3",
                "rushing_yards": "35",
                "rushing_avg_yards": "11.7",
                "rushing_touchdowns": "0",
                "longest_rush": "23",
                "undefined": "42"
            }
        ]
    };
    describe('findKey', () => {
        const completions = findKey(player, 'stats.1.passing_completions');
        expect(completions).to.eql('23');
    });
    describe('calculatePlayerPts', () => {
        calculatePlayerPts(player);

        expect(player.stats[0].touchdownPts).to.eql(16)
        expect(player.stats[0].interceptionPts).to.eql(-6)
        expect(player.stats[0].passingPts).to.eql(12)
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
    })
    describe('pts from passing yrd', () => {
        it('Jameis Winston total points', () => {
            player = getPlayer('2969939');
            calculatePlayerPts(player);
            sumPlayerPts(player);
            expect(player.seasonPts.passingPts).to.equal(199);
        })
        
        it('Every 25 passing yards = 1 point', () => {
            expect(passPts(250)).to.eql(10);
        })
        
        it('Every touchdown = 4 points', () => {
            expect(touchdownPts(3)).to.eql(12);
        })
        it('Every interception = -2 points', () => {
            expect(interceptionPts(3)).to.eql(-6);
        })
    });
});
    