export const buildUrl = function (url, replacements) {
    const reFind = /\{([^\}]+)\}/g

    return url.replace(reFind, (match, found) => {
        return replacements[found];
    });
} 

export const getGameIdFromSchedulePage = ($, x, y) => {
    let gameSelector = `#sched-container > div:nth-child(${x}) > table> tbody > tr:nth-child(${y}) > td:nth-child(3) > a`;
    return $(gameSelector).attr('href');
}