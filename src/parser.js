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

export function calculatePlayerPts(player) {
    player.stats.forEach((game) => {
        game.passingPts = passPts(game.passing_yards);
        game.touchdownPts = touchdownPts(game.passing_touchdowns);
        game.interceptionPts = interceptionPts(game.passing_interceptions);
        
        game.totalPts = game.passingPts + game.touchdownPts + game.interceptionPts; // Sum above
    });
}
export function sumPlayerPts(player) {
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

export function sumAllPlayers(playerData) {
    const players = playerData.map((p) => {
        calculatePlayerPts(p);
        sumPlayerPts(p)
        return p;
    });
    return players;
}

export function rankPlayers(playerData, key) {
    return playerData.sort((a, b) => findKey(b, key) - findKey(a, key));
}

export function findKey(o, path) {
    const paths = path.split('.');
    return paths.reduce((obj, p) => {
        return obj[p];
    }, o);
}


export function getPlayer(id) {
    const data = JSON.parse(fs.readFileSync('./qb-data.json'));
    return data.find((player) => player.playerId === id);
}

export function passPts(yards) {
    return Math.floor(yards / 25);
}
export function touchdownPts(touchdowns) {
    return touchdowns * 4;
}
export function interceptionPts(picks) {
    return picks * -2;
}
    