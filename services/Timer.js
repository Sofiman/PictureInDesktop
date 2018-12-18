const path = require('path');

module.exports = {
    category: 'Others',
    getStreamURL: function getStreamURL() {
        return path.join(__dirname, '../render/timer/timer.html');
    },
    darkMode: true
};
