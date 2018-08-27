module.exports = {
    category: 'Experimental',
    getStreamURL: function getStreamURL(inputURL) {
        const regex = /^((?:https?:)?\/\/)?((?:www|m|gaming)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/g;
        let result = regex.exec(inputURL);
        return result && result[5] ? `https://youtube.com/live_chat?is_popout=1&v=${result[5]}` : undefined;
    },
    force: true,
    darkMode: true
};
