// --- Imports ---
const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    globalShortcut
} = require('electron')
const { join, basename } = require('path')
const fs = require("fs")

// --- Screens Variables ---
let mainWin
let valueChangeWin
let historyOrc
let shopping

// --- Main Application ---

app.on("ready", () => {
    mainWin = new BrowserWindow({
        width: 1460,
        height: 1000,
        center: true,
        show: true,
        maximizable: true,
        autoHideMenuBar: true,
        icon: join(__dirname, "assets/icon.png"),
        webPreferences: {
            nodeIntegration: true,
        },
    })

    // mainWin.focus()
    globalShortcut.register('CmdOrCtrl+=', () => {
        try {
            BrowserWindow.getFocusedWindow().webContents.setZoomLevel(
                BrowserWindow.getFocusedWindow().webContents.getZoomLevel() + 0.5
            )
        } catch { }
    })
    mainWin.webContents.setZoomFactor(1, 5)
    mainWin.webContents.setZoomLevel(5.0)

    mainWin.loadFile(join(__dirname, "Screens", "main", "index.html"))
    // mainWin.once("ready-to-show", () => mainWin.show())
})

// --- Ipc Events ---
ipcMain.on("newOrc", () => {
    mainWin.loadFile(join(__dirname, "Screens", "EorT", "index.html"))
})

ipcMain.on("termeOrc", () => {
    mainWin.loadFile(join(__dirname, "Screens", "mesa", "index.html"))
})

ipcMain.on("close", () => valueChangeWin.close())

ipcMain.on("openShop", (event, arg) => {

    if (shopping == undefined) {
        shopping = new BrowserWindow({
            width: 1080,
            height: 720,
            center: true,
            autoHideMenuBar: true,
            show: true,
            icon: join(__dirname, "assets/icon.png"),
            webPreferences: {
                contextIsolation: false,
                nodeIntegration: true,
            }
        })

        shopping.on("close", () => shopping = null)

    } else shopping.focus()
    shopping.loadFile(join(__dirname, "Screens", "shopping", "index.html"))

    mainWin.loadFile(join(__dirname, "Screens", "mesa", "index.html"))

})

ipcMain.on("modifyInfo", (event, arg) => {
    if (valueChangeWin == undefined) {
        valueChangeWin = new BrowserWindow({
            width: 1080,
            height: 720,
            center: true,
            autoHideMenuBar: true,
            show: true,
            icon: join(__dirname, "assets/icon.png"),
            webPreferences: {
                contextIsolation: false,
                nodeIntegration: true,
            }
        })
        valueChangeWin.on("close", () => valueChangeWin = null)
    } else {
        valueChangeWin.close()
        valueChangeWin = new BrowserWindow({
            width: 600,
            height: 320,
            center: true,
            autoHideMenuBar: true,
            show: true,
            icon: join(__dirname, "assets/icon.png"),
            webPreferences: {
                contextIsolation: false,
                nodeIntegration: true,
            }
        })
    }
    valueChangeWin.loadFile(join(__dirname, "Screens", "value", "index.html"))
})

ipcMain.on("backOpera", () => {
    mainWin.loadFile(join(__dirname, "Screens", "opera", "index.html"))
})

ipcMain.on("closeShop", () => {
    try {
        shopping.close()
    } catch { }
    shopping = undefined
})

ipcMain.on("embamOrc", () => {
    mainWin.loadFile(join(__dirname, "Screens", "mesa", "index.html"))
})

ipcMain.on("showError", (event, arg) => {
    dialog.showErrorBox(arg[0], arg[1])
})

ipcMain.on("showMsg", (event, arg) => {
    dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
        message: arg[0],
        type: "info",
        title: arg[1]
    })
})

ipcMain.on("orcamentPDF", async () => {
    if (valueChangeWin == undefined) {
        valueChangeWin = new BrowserWindow({
            width: 1080,
            height: 720,
            center: true,
            autoHideMenuBar: true,
            icon: join(__dirname, "assets/icon.png"),
            show: true,
            webPreferences: {
                contextIsolation: false,
                nodeIntegration: true,
            }
        })
        valueChangeWin.on("close", () => valueChangeWin = undefined)
    } else valueChangeWin.focus()

    valueChangeWin.loadFile(join(__dirname, "Screens", "orcamentPDF", "index.html"))
})

ipcMain.on("importInfo", async () => {
    if (valueChangeWin == undefined) {
        valueChangeWin = new BrowserWindow({
            width: 1080,
            height: 720,
            center: true,
            icon: join(__dirname, "assets/icon.png"),
            autoHideMenuBar: true,
            show: true,
            webPreferences: {
                contextIsolation: false,
                nodeIntegration: true,
            }
        })
        valueChangeWin.on("close", () => valueChangeWin = undefined)
    } else valueChangeWin.focus()

    valueChangeWin.loadFile(join(__dirname, "Screens", "addMP", "index.html"))
})

ipcMain.on("importar", async (event, arg) => {
    const result = dialog.showOpenDialogSync({
        properties: ["openFile"], filters: [
            { name: 'Planilhas Do Microsoft Excel', extensions: ['xlsx'] },
        ]
    })

    if (!result) return

    let [path] = result
    const name = basename(path)
    while (String(path).includes("\\")) path = String(path).replace("\\", "/")
    json = { path, name }
    json = JSON.stringify(json);
    if (arg == "MP") event.reply("mpData", path)
    else if (arg == "DI") event.reply("diData", path)
    else if (arg == "opera") event.reply("operaData", path)
    else if (arg == "report") event.reply("reportData", path)
})

ipcMain.on("searchPDF", async (event, arg) => {
    let result = await dialog.showSaveDialogSync({
        properties: ["createDirectory"], filters: [
            { name: 'PDF', extensions: ['pdf'] },
        ]
    })
    while (String(result).includes("\\")) result = String(result).replace("\\", "/")

    event.reply("hideContent", result)
})

ipcMain.on("higi", async (event, arg) => {
    let options = {
        buttons: ["Sim", "Não", "Cancelar"],
        message: "Produto higienizado?"
    }
    let response = await dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), options)
    event.reply("higiRes", response)
})

ipcMain.on("emitPDF", (event, arg) => {
    var options = {
        marginsType: 1,
        pageSize: "A4",
        // {
        //     "width": 656167, // microns
        //     "height": 928158.3
        // },
        printBackground: true,
        printSelectionOnly: false,
        landscape: false
    }
    valueChangeWin.webContents.printToPDF(options).then(async data => {
        await fs.writeFileSync(arg, data)
    }).catch(error => {
        console.log(error)
    });
    event.reply("showContent")
})

ipcMain.on("historyOrc", async () => {
    historyOrc = new BrowserWindow({
        width: 1080,
        height: 720,
        center: true,
        autoHideMenuBar: true,
        icon: join(__dirname, "assets/icon.png"),
        show: true,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
        }
    })
    historyOrc.on("close", () => historyOrc = undefined)

    historyOrc.loadFile(join(__dirname, "Screens", "historyOrc", "index.html"))
})

ipcMain.on("loadOrcament", () => {
    if (valueChangeWin == undefined) {
        valueChangeWin = new BrowserWindow({
            width: 1080,
            height: 720,
            center: true,
            icon: join(__dirname, "assets/icon.png"),
            autoHideMenuBar: true,
            show: true,
            webPreferences: {
                contextIsolation: false,
                nodeIntegration: true,
            }
        })
        valueChangeWin.on("close", () => valueChangeWin = undefined)
    } else valueChangeWin.focus()

    valueChangeWin.loadFile(join(__dirname, "Screens", "orcamentPDF", "index.html"))
})

ipcMain.on("report", () => {
    mainWin.loadFile(join(__dirname, "Screens", "report", "index.html"))
})

ipcMain.on("markupScreen", () => {
    mainWin.loadFile(join(__dirname, "Screens", "markup", "index.html"))
})

ipcMain.on("back", () => {
    mainWin.loadFile(join(__dirname, "Screens", "EorT", "index.html"))
})

ipcMain.on("backMain", () => {
    mainWin.loadFile(join(__dirname, "Screens", "main", "index.html"))
})

ipcMain.on("backTo", () => {
    mainWin.focus()
    mainWin.loadFile(join(__dirname, "Screens", "mesa", "index.html"))
})

ipcMain.on("operations", () => {
    mainWin.loadFile(join(__dirname, "Screens", "opera", "index.html"))
})

ipcMain.on("changeScreen", (event, arg) => {
    console.log(arg)
    if (arg === "MP")
        valueChangeWin.loadFile(join(__dirname, "Screens", "mp", "index.html"))
    else if (arg === "DI")
        valueChangeWin.loadFile(join(__dirname, "Screens", "di", "index.html"))
})

ipcMain.on("reloadMesa", () => {
    mainWin.loadFile(join(__dirname, "Screens", "mesa", "index.html"))
})