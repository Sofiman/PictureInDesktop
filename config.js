const path = require('path');
const fs = require('fs');

let config = {
    VERSION: '0.1.2-pre',

    WIDTH: 800,
    HEIGHT: 340,

    MAGNET_REACH: 20,
    MAGNET_BOX: 5,

    INDEX_PAGE: 'render/index.html',
    EMBED_PAGE: 'render/embed.html',
    ABOUT_PAGE: 'render/about.html',
    TRAY_ICON: 'render/tray.png',
    MODULES_DIR: 'services',

    SERVICES: {
        'File': {
            getStreamURL: function getStreamURL(inputURL) {
                return `file://${inputURL}`
            },
            darkMode: true
        },

        'Custom': {
            getStreamURL: function getStreamURL(inputURL) {
                return inputURL
            },
            force: true
        },
    },

    SERVICE_CATEGORIES: {
        'Default': [],
        'Others': ['File', 'Custom']
    }

};

module.exports = config;
module.exports.readModules = function readModules(modulesDir, callback) {
    let dir = path.join(__dirname, modulesDir);
    fs.readdir(dir, (err, dir) => {
        for (let filePath of dir) {
            let service = require(`./${modulesDir}/${filePath}`), serviceName = path.basename(filePath, '.js');
            if (!service.category) {
                console.error('Warning: Skipped the Service', filePath, 'because of no category defined');
                continue;
            }
            config.SERVICES[serviceName] = service;
            if (service.category.toLowerCase() === 'experimental') {
                if (process.argv.indexOf('--dev') >= 0) {
                    if (!config.SERVICE_CATEGORIES['Experimental']) {
                        config.SERVICE_CATEGORIES['Experimental'] = [];
                    }
                    config.SERVICE_CATEGORIES['Experimental'].push(serviceName);
                }
            } else if (config.SERVICE_CATEGORIES[service.category]) {
                config.SERVICE_CATEGORIES[service.category].push(serviceName);
            } else {
                config.SERVICE_CATEGORIES[service.category] = [serviceName];
            }
        }
        callback();
    });
};