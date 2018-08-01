const electron = require('electron');
const path = require('path');
const { app, BrowserWindow, Menu, ipcMain, shell, Tray, dialog, nativeImage } = electron;
const config = require('./config');
process.env.pictureidesktop = config.VERSION;

let win, tray;
let popups = [];

function createWindow() {
    win = new BrowserWindow({
        width: config.WIDTH, height: config.HEIGHT,
        title: 'Picture In Desktop',
        maximizable: false,
        resizable: false
    });

    setupIPC();

    const appMenu = Menu.buildFromTemplate([{
        label: 'Developers',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: 'CmdOrCtrl+Shift+I',
                click() { win.webContents.openDevTools() }
            },
            {
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click() { win.loadFile(config.INDEX_PAGE) }
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

    app.showExitPrompt = true;
    win.on('close', e => {
       if(popups.length > 0 && app.showExitPrompt){
           e.preventDefault();
           dialog.showMessageBox({
               type: 'question',
               buttons: ['Hide in Tray', 'Close all', 'Cancel'],
               title: 'Confirm',
               message: 'All popups will be closed, do you want to close or hide in tray?'
           }, response => {
               if(response === 0) {
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

function createPopup(url, service, size, force, offsetY, darkMode){
    let display = electron.screen.getPrimaryDisplay();
    let maxY = display.workAreaSize.height - 5;

    let popup = new BrowserWindow({
        width: size.width ? size.width : 720, height: size.height ? size.height : 480,
        x: display.workAreaSize.width - (size.width ? size.width : 720) - 5,
        y: display.workAreaSize.height - (size.height ? size.height : 480) - 5,
        frame: false,
        alwaysOnTop: true,
        webPreferences: { plugins: true },
        title: 'Embed Frame'
    });

    const appMenu = Menu.buildFromTemplate([{
        label: 'Developers',
        submenu: [
            {
                label: 'Toggle Dev Tools',
                accelerator: 'CmdOrCtrl+Shift+I',
                click() { popup.webContents.openDevTools() }
            }
        ]
    }]);

    popup.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    Menu.setApplicationMenu(appMenu);
    popup.setMenuBarVisibility(false);

    if(!force){
        popup.embedStreamURL = url;
        popup.providerService = service;
        popup.offsetY = offsetY;
        if(darkMode) popup.darkMode = darkMode;
        popup.closeAll = () => popup.close();
        popup.loadFile(config.EMBED_PAGE);
    } else {
        popup.loadURL(url);
    }

    popup.setSkipTaskbar(false);

    popups.push({window: popup, streamURL: url, service: service});
    popup.on('move', () => {
        let bounds = popup.getBounds();
        if(bounds.x <= config.MAGNET_REACH && bounds.x > 0) bounds.x = config.MAGNET_BOX;
        if(bounds.y <= config.MAGNET_REACH && bounds.y > 0) bounds.y = config.MAGNET_BOX;
        if(bounds.y >= maxY - config.MAGNET_REACH + bounds.height) bounds.y = maxY - config.MAGNET_BOX;
        popup.setBounds(bounds);
    });
    popup.on('closed', () => popups = popups.filter(pp => pp.window !== popup));
}

function setupIPC(){
    ipcMain.on('bridge-config', function(){
        win.webContents.send('bridge-config-load', config.SERVICE_CATEGORIES);
    });
    ipcMain.on('bridge-post', function (e, result) {
        let service = config.SERVICES[result.service];
        if(service){
            let embedURL = service.getStreamURL(result.streamURL);
            if(embedURL){
                console.log('Input URL:', result.streamURL);
                restartPIP(embedURL, result.service, result.size, result.force === true || service.force, service.controlsYOffset ? service.controlsYOffset : 10, service.darkMode);
            } else {
                win.webContents.send('bridge-error', `Invalid URL for the <strong>${result.service}</strong> service`);
            }
        }
    });
}

function restartPIP(url, service, size, force, offY, darkMode) {
    win.hide();
    showTray();
    console.log('Embed Stream URL:', url);
    createPopup(url, service, size, force, offY, darkMode)
}

function showTray(){
    if(tray === undefined){
        let trayIcon = nativeImage.createFromPath(path.join(__dirname, config.TRAY_ICON));
        tray = new Tray(trayIcon);
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Open',
                click(){
                    if(!win.isVisible()){
                        win.loadFile(config.INDEX_PAGE);
                        win.show()
                    }
                }
            },
            {
                label: 'Close All Windows',
                click(){
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
            if(!win.isVisible()){
                win.loadFile(config.INDEX_PAGE);
                win.show()
            }
        });
        tray.setHighlightMode('always');
    }
}

function closeAll(){
    popups.filter(pp => !pp.window.isDestroyed()).forEach(pp => pp.window.close());
    if(!win.isDestroyed()) win.close()
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if(tray) tray.destroy();
    if (process.platform !== 'darwin')
        app.quit()
});

app.on('activate', () => {
    if (win === null)
        createWindow()
});