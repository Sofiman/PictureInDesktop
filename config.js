function toSeconds(time){
    let seconds = 0;
    let regex = /([0-9]+d)?([0-9]+h)?([0-9]+m)?([0-9]+s)?/g;
    let parsed = regex.exec(time);

    seconds += (parsed[1] ? parseInt(parsed[1].replace('d', '')) : 0);
    seconds += 3600 * (parsed[2] ? parseInt(parsed[2].replace('h', '')) : 0);
    seconds += 60 * (parsed[3] ? parseInt(parsed[3].replace('m', '')) : 0);
    seconds += (parsed[4] ? parseInt(parsed[4].replace('s', '')) : 0);

    return seconds;
}

module.exports =  {
    WIDTH: 800,
    HEIGHT: 340,

    INDEX_PAGE: 'render/index.html',
    EMBED_PAGE: 'render/embed.html',
    ABOUT_PAGE: 'render/about.html',

    SERVICES: {
        'Youtube': function getStreamURL(inputURL){
            const regex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/g;
            let result = regex.exec(inputURL);

            let queries = '';
            if(result && result[6]){
                let regex2 = /(time_continue|time|t)=([0-9dhms]+)/g;
                let result2 = regex2.exec(inputURL);
                queries = result[6].replace(result2[0], `start=${toSeconds(result2[2])}`);
            }

            return result && result[5] ? `https://www.youtube.com/embed/${result[5]}${queries}` : undefined
        },
        'Twitch': function getStreamURL(inputURL){
            const regex = /^((?:https?:)?\/\/)?((?:www)\.)?((?:twitch\.tv))\/?([\w\-]+)(\S+)?$/;
            let result = undefined;
            if(regex.test(inputURL)){
                let groups = regex.exec(inputURL);
                if(groups && groups[4]){
                    result = `http://player.twitch.tv/?channel=${groups[4]}`;
                }
            }
            return result;
        },
        'Spotify': function getStreamURL(inputURL){
            const regex = /(spotify):(album|track|artist):(.*)/g, regex2 = /((?:https?:)?\/\/)?open.spotify.com\/album\/(.*)/g;
            let result = undefined;
            if(regex.test(inputURL)){
                result = `https://open.spotify.com/embed?uri=${inputURL}`;
            } else if(regex2.test(inputURL)){
                result = inputURL;
            }

            return result;
        },
        'Dailymotion': function getStreamURL(inputURL){
            const regex = /((?:https?:)?\/\/)?(www\.)?dailymotion.com\/video\/(.*)/;
            let result = undefined;
            if(regex.test(inputURL)){
                let groups = regex.exec(inputURL);
                if(groups && groups[3]){
                    result = `https://www.dailymotion.com/embed/video/${groups[3]}?autoplay=1`;
                }
            }

            return result;
        },
        'Vimeo': function getStreamURL(inputURL){
            const regex = /((?:https?:)?\/\/)?vimeo.com\/([0-9]+)/;
            let result = undefined;
            if(regex.test(inputURL)){
                let groups = regex.exec(inputURL);
                if(groups && groups[2]){
                    result = `https://player.vimeo.com/video/${groups[2]}`;
                }
            }

            return result;
        },
        'Soundcloud': function getStreamURL(inputURL){
            const regex = /(https?)?:\/\/w\.soundcloud\.com\/player\/\?url=(.+)"/;

            return regex.test(inputURL) ? regex.exec(inputURL)[0] : undefined;
        },

        'TF1': function getStreamURL(){
            return 'https://www.wat.tv/embedframe/liveV4'
        },
        'File': function getStreamURL(inputURL){
            return `file://${inputURL}`
        },

        'Custom': function getStreamURL(inputURL){
            return inputURL;
        }
    },

    SERVICE_CATEGORIES: {
        'Default': ['Youtube', 'Twitch', 'Spotify', 'Dailymotion', 'Vimeo', 'Soundcloud'],
        'TV Channels': ['TF1'],
        'Others': ['File', 'Custom']
    }

};