module.exports = {
    category: 'Default',
    getStreamURL: function getStreamURL(inputURL) {
        const regex = /((?:https?:)?\/\/)?(www\.)?dailymotion.com\/video\/(.*)/;
        let result = undefined;
        if (regex.test(inputURL)) {
            let groups = regex.exec(inputURL);
            if (groups && groups[3]) {
                result = `https://www.dailymotion.com/embed/video/${groups[3]}?autoplay=1`;
            }
        }

        return result;
    }
};
