const electron = require('electron');
const { app, BrowserWindow, Menu, ipcMain, shell, Tray, dialog } = electron;
const config = require('./config');
process.versions.pictureidesktop = config.VERSION;

let win, tray;
let popups = [];

function createWindow() {
    win = new BrowserWindow({
        width: config.WIDTH, height: config.HEIGHT,
        title: 'Picture In Desktop',
        maximizable: false
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
                label: 'About Page',
                accelerator: 'CmdOrCtrl+B',
                click() { win.loadFile(config.ABOUT_PAGE) }
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

function createPopup(url, service, size, force){
    let display = electron.screen.getPrimaryDisplay();

    let popup = new BrowserWindow({
        width: size.width ? size.width : 720, height: size.height ? size.height : 480,
        x: display.workAreaSize.width - (size.width ? size.width : 720) - 5,
        y: display.workAreaSize.height - (size.height ? size.height : 480) - 5,
        frame: false,
        alwaysOnTop: true,
        webPreferences: { plugins: true }
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
        popup.closeAll = () => {
            popups = popups.filter(pp => pp.window !== popup);
            popup.close();
        };
        popup.loadFile(config.EMBED_PAGE);
    } else {
        popup.loadURL(url);
    }

    popup.setSkipTaskbar(false);

    popups.push({window: popup, streamURL: url, service: service});
}

function setupIPC(){
    ipcMain.on('bridge-config', function(){
        win.webContents.send('bridge-config-load', config.SERVICE_CATEGORIES);
    });
    ipcMain.on('bridge-post', function (e, result) {
        let service = config.SERVICES[result.service];
        if(service){
            let embedURL = service(result.streamURL);
            if(embedURL){
                console.log('Input URL:', result.streamURL);
                restartPIP(embedURL, result.service, result.size, result.force ? result.force : false);
            } else {
                win.webContents.send('bridge-error', `Invalid URL for the <strong>${result.service}</strong> service`);
            }
        }
    });
}

function restartPIP(url, service, size, force) {
    win.hide();
    showTray();
    console.log('Embed Stream URL:', url);
    createPopup(url, service, size, service === 'Custom' ? true : force)
}

function showTray(){
    if(tray === undefined){
        tray = new Tray(config.TRAY_ICON);
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
    popups.forEach(pp => pp.window.close());
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