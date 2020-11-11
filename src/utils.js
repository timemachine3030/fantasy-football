export const buildUrl = function (url, replacements) {
    const reFind = /\{([^\}]+)\}/g

    return url.replace(reFind, (match, found) => {
        return replacements[found];
    });
} 
