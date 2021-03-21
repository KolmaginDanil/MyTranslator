const {app, BrowserWindow, clipboard, globalShortcut, Menu, ipcMain} = require('electron')
const {getText} = require('./RAndT')

const resultsArray = []
const errorsArray = []
let win

function createWindow() {
    win = new BrowserWindow({
        x: 986,
        y: 3,
        width: 384,
        height: 1024,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true
        }
    })
    win.loadFile('index.html').catch(e => console.error(e, '\x1b[31m' + 'index.html didn\'t load' + '\x1b[0m'))
}

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.whenReady().then(() => {
    createWindow()

    const {commandsMap} = Menu.getApplicationMenu()
    const template = []
    for (const prop in commandsMap) {
        if (commandsMap.hasOwnProperty(prop)) {
            template[+prop] = commandsMap[prop]
        }
    }
    const menu = Menu.buildFromTemplate(template)

    let timeout
    let textFromInput
    ipcMain.on('input', (_, data) => textFromInput = data)

    const recursive = () => {
        timeout = null

        getText(resultsArray, clipboard, textFromInput)
            .then(res => {
                resultsArray.push(res.text)
                //console.log(resultsArray[resultsArray.length - 1])
                win.webContents.send('wantLog', res)
            })
            .catch(err => {
                errorsArray.push(err)
                win.webContents.send('wantErr', errorsArray)
            })
            .finally(() => {
                textFromInput = undefined
                timeout = setTimeout(() => recursive(), 1500)
            })
    }

    recursive()

    Menu.setApplicationMenu(menu);
})

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})