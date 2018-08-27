module.exports = {
    category: 'Default',
    getStreamURL: function getStreamURL(inputURL) {
        const regex = /^((?:https?:)?\/\/)?((?:www)\.)?((?:twitch\.tv))\/?([\w\-]+)(\S+)?$/;
        let result = undefined;
        if (regex.test(inputURL)) {
            let groups = regex.exec(inputURL);
            if (groups && groups[4]) {
                result = `http://player.twitch.tv/?channel=${groups[4]}`;
            }
        }
        return result;
    }
};
