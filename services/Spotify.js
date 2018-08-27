module.exports = {
    category: 'Default',
    getStreamURL: function getStreamURL(inputURL) {
        const regex = /(spotify):(album|track|artist):(.*)/g,
            regex2 = /((?:https?:)?\/\/)?open.spotify.com\/album\/(.*)/g;
        let result = undefined;
        if (regex.test(inputURL)) {
            result = `https://open.spotify.com/embed?uri=${inputURL}`;
        } else if (regex2.test(inputURL)) {
            result = inputURL;
        }

        return result;
    }
};
