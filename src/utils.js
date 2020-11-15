import http from 'axios';
import rateLimit from 'axios-rate-limit';

export const buildUrl = function (url, replacements) {
    const reFind = /\{([^}]+)}/g;

    return url.replace(reFind, (match, found) => {
        return replacements[found];
    });
}; 

export const getGameIdFromSchedulePage = ($, x, y) => {
    let gameSelector = `#sched-container > div:nth-child(${x}) > table> tbody > tr:nth-child(${y}) > td:nth-child(3) > a`;
    return $(gameSelector).attr('href');
};

let axios;
export const getAxiosInstance = () => {
    if (!axios) {
        axios = rateLimit(http.create(), {
            maxRPS: 4
        });
    }
    return axios;
};

export const getLinkIndex = (text, idx) => {
    let parts = text.split('/');
    return parts[idx];
};
export const getLinkIndexAsInt = (text, idx) => {
    return parseInt(getLinkIndex(text, idx), 10);
};
export const playerIdFromLink = (text) => {
    let parts = text.split('/');
    return parseInt(parts[5], 10);
};