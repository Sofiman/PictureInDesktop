const electron = require('electron');
const path = require('path');
const url = require('url');
const { app, BrowserWindow, Menu, ipcMain, shell, Tray, dialog, nativeImage } = electron;
const config = require('./config');
process.env.pictureidesktop = config.VERSION;

let win, tray, popups = [], pluginName, directStartPip = false;

switch (process.platform) {
    case 'win32':
        pluginName = 'pepflashplayer.dll';
        break;
    case 'darwin':
        pluginName = 'PepperFlashPlayer.plugin';
        break;
    case 'linux':
        pluginName = 'libpepflashplayer.so';
        break;
}
app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, pluginName));
app.commandLine.appendSwitch('ppapi-flash-version', '31.0.0.108');

function createWindow() {
    if(process.argv.indexOf('--pip') >= 0){
        let i = -1;
        process.argv.forEach((val, index) => {
           if(val && val.toLowerCase().startsWith('pipd://'))
               i = index;
        });
        if(i >= 0) {
            const url = new URL(process.argv[i]);
            if(url) {
                let command = url.hostname;
                if (command.toLowerCase().startsWith('open')) {
                    directStartPip = { command, params: url.searchParams };
                    console.log('Open command detected:', directStartPip);
                }
            } else {
                dialog.showMessageBox({type: 'error', title: 'Internal Error', message: 'Failed to parse the request'});
            }
        }
    }
    app.setAsDefaultProtocolClient('pipd', `${process.execPath}" "${__dirname}" --pip "`);
    win = new BrowserWindow({
        width: config.WIDTH, height: config.HEIGHT,
        title: 'Picture In Desktop',
        maximizable: false,
        resizable: false,
        show: !directStartPip
    });

    setupIPC();

    const appMenu = Menu.buildFromTemplate([{
        label: 'Developers',
        submenu: [
            {
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click() {
                    win.loadFile(config.INDEX_PAGE)
                }
            },
            {
                label: 'Toggle Dev Tools',
                accelerator: 'CmdOrCtrl+Shift+I',
                click() {
                    if (process.argv.indexOf('--dev') >= 0) win.webContents.openDevTools()
                }
            }
        ]
    }]);

    win.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    Menu.setApplicationMenu(appMenu);
    win.setMenuBarVisibility(false);

    win.loadFile(config.INDEX_PAGE);

    config.readModules(config.MODULES_DIR, () => {
        if(directStartPip && directStartPip.params.has('url') && directStartPip.params.has('service')){
            let service = config.SERVICES[directStartPip.params.get('service')];
            if(service){
                let size = {};
                const url = service.getStreamURL(directStartPip.params.get('url'));
                if(directStartPip.params.has('width')) size.width = directStartPip.params.get('width');
                if(directStartPip.params.has('height')) size.height = directStartPip.params.get('height');
                restartPIP(url, directStartPip.params.get('service'), size, service.controlsYOffset ? service.controlsYOffset : 10,
                    service.darkMode, directStartPip.params.has('opacity') ? directStartPip.params.get('opacity') : 1);
            }
        }
    });

    app.showExitPrompt = true;
    win.on('close', e => {
        if (popups.length > 0 && app.showExitPrompt) {
            e.preventDefault();
            dialog.showMessageBox({
                type: 'question',
                buttons: ['Hide in Tray', 'Close all', 'Cancel'],
                title: 'Confirm',
                message: 'All popups will be closed, do you want to close or hide in tray?'
            }, response => {
                if (response === 0) {
                    showTray();
                    win.hide();
                } else if (response === 1) {
                    app.showExitPrompt = false;
                    win.close()
                }
            })
        }
    });
    win.on('closed', () => closeAll())
}

function createPopup(url, service, size, offsetY, darkMode, opacity) {
    let display = electron.screen.getPrimaryDisplay();
    let maxY = display.workAreaSize.height;

    let popup = new BrowserWindow({
        width: size.width ? size.width : 720, height: size.height ? size.height : 480,
        x: display.workAreaSize.width - (size.width ? size.width : 720) - 5,
        y: maxY - (size.height ? size.height : 480) - 5,
        frame: false,
        alwaysOnTop: true,
        webPreferences: { plugins: true },
        title: `${service} Embed Frame`
    });

    popup.setOpacity(opacity);

    const appMenu = Menu.buildFromTemplate([{
        label: 'Developers',
        submenu: [
            {
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click() {
                    popup.embedStreamURL = url;
                    popup.providerService = service;
                    popup.offsetY = offsetY;
                    if (darkMode) popup.darkMode = darkMode;
                    popup.closeAll = () => popup.close();
                    popup.loadFile(config.EMBED_PAGE);
                }
            },
            {
                label: 'Toggle Dev Tools',
                accelerator: 'CmdOrCtrl+Shift+I',
                click() {
                    popup.webContents.openDevTools()
                }
            }
        ]
    }]);

    popup.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    Menu.setApplicationMenu(appMenu);
    popup.setMenuBarVisibility(false);

    popup.embedStreamURL = url;
    popup.providerService = service;
    popup.offsetY = offsetY;
    if (darkMode) popup.darkMode = darkMode;
    popup.closeAll = () => popup.close();
    popup.loadFile(config.EMBED_PAGE);

    popup.setSkipTaskbar(false);

    popups.push({ window: popup, streamURL: url, service: service });
    popup.on('move', () => {
        let bounds = popup.getBounds();
        if (bounds.x <= config.MAGNET_REACH && bounds.x > 0) bounds.x = config.MAGNET_BOX;
        if (bounds.y <= config.MAGNET_REACH && bounds.y > 0) bounds.y = config.MAGNET_BOX;
        popup.setBounds(bounds);
    });
    popup.on('closed', () => {
        popups = popups.filter(pp => pp.window !== popup);
        if(popups.length === 0) closeAll();
    });
}

function setupIPC(){
    ipcMain.on('bridge-config', () => win.webContents.send('bridge-config-load', config.SERVICE_CATEGORIES));
    ipcMain.on('bridge-post', function (e, result) {
        let service = config.SERVICES[result.service];
        if (service) {
            let embedURL = service.getStreamURL(result.streamURL);
            if (embedURL) {
                console.log('Input URL:', result.streamURL);
                restartPIP(embedURL, result.service, result.size, service.controlsYOffset ? service.controlsYOffset : 10, service.darkMode,
                    result.opacity);
            } else {
                win.webContents.send('bridge-error', `Invalid URL for the <strong>${result.service}</strong> service`);
            }
        }
    });
}

function restartPIP(url, service, size, offY, darkMode, opacity) {
    win.hide();
    showTray();
    console.log('Embed Stream URI:', url);
    createPopup(url, service, size, offY, darkMode, opacity)
}

function showTray() {
    if (tray === undefined) {
        let trayIcon = nativeImage.createFromPath(path.join(__dirname, config.TRAY_ICON));
        tray = new Tray(trayIcon);
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Open',
                click() {
                    if (!win.isVisible()) {
                        win.loadFile(config.INDEX_PAGE);
                        win.show()
                    }
                }
            },
            {
                label: 'Close All Windows',
                click() {
                    popups.forEach(pp => pp.window.close())
                },
            },
            {
                label: 'Exit',
                click: () => closeAll()
            }
        ]);
        tray.setToolTip('PictureInDesktop');
        tray.setContextMenu(contextMenu);

        tray.on('click', () => {
            if (!win.isVisible()) {
                win.loadFile(config.INDEX_PAGE);
                win.show()
            }
        });
        tray.setHighlightMode('always');
    }
}

function closeAll() {
    popups.filter(pp => !pp.window.isDestroyed()).forEach(pp => pp.window.close());
    popups = [];
    if (!win.isDestroyed()) win.close()
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if (tray) tray.destroy();
    if (process.platform !== 'darwin')
        app.quit()
});

app.on('activate', () => {
    if (win === null)
        createWindow()
});