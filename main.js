const electron = require('electron');
const {app, BrowserWindow, Menu, ipcMain, shell } = electron;
const config = require('./config');

let win, popup;

function createWindow(defaultConfig = true) {
    win = new BrowserWindow({
        width: config.WIDTH, height: config.HEIGHT,
        frame: defaultConfig,
        alwaysOnTop: !defaultConfig
    });

    if(defaultConfig){
        setupIPC();
    }

    const appMenu = Menu.buildFromTemplate([{
        label: 'Developers',
        submenu: [
            {
                label: 'Toggle Dev Tools',
                accelerator: 'CmdOrCtrl+Shift+I',
                click() { win.webContents.openDevTools() }
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

    win.on('closed', () => win = null)
}

function createPopup(url){
    let display = electron.screen.getPrimaryDisplay();

    popup = new BrowserWindow({
        width: 720, height: 480,
        x: display.workAreaSize.width - 725,
        y: display.workAreaSize.height - 485,
        frame: false,
        alwaysOnTop: true,
        modal: true,
        parent: win
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

    popup.embedStreamURL = url;
    popup.closeAll = function(){
        popup.close();
        win.close();
    };
    popup.loadFile(config.EMBED_PAGE);

    popup.on('closed', () => popup = null)
}

function setupIPC(){
    ipcMain.on('bridge-post', function (e, result) {
        let service = config.SERVICES[result.service];
        if(service){
            let embedURL = service(result.streamURL);
            restartPIP(embedURL);
        }
    });
}

function restartPIP(url) {
    win.hide();
    console.log('Embed Stream URL:', url);
    createPopup(url)
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit()
});

app.on('activate', () => {
    if (win === null)
        createWindow()
});