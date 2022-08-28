const {
    app,
    BrowserWindow,
    ipcMain,
    dialog
} = require('electron')
const { join, basename } = require('path')
const fs = require("fs")

let mainWin
let valueChangeWin

app.on("ready", () => {
    mainWin = new BrowserWindow({
        width: 1460,
        height: 1000,
        center: true,
        autoHideMenuBar: true,
        show: false,
        maximizable: true,
        icon: join(__dirname, "assets/icon.png"),
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true,
        }
    })

    // mainWin.focus()
    mainWin.once("ready-to-show", () => mainWin.show())
    mainWin.loadFile(join(__dirname, "Screens", "main", "index.html"))
})

ipcMain.on("newOrc", () => {
    mainWin.loadFile(join(__dirname, "Screens", "EorT", "index.html"))
})

ipcMain.on("termeOrc", () => {
    mainWin.loadFile(join(__dirname, "Screens", "mesa", "index.html"))
})

ipcMain.on("close", () => valueChangeWin.close())

ipcMain.on("modifyInfo", (event, arg) => {
    if (valueChangeWin == undefined) {
        valueChangeWin = new BrowserWindow({
            width: 1080,
            height: 720,
            center: true,
            autoHideMenuBar: true,
            show: true,
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

ipcMain.on("emitPDF", (event, arg) => {
    var options = {
        marginsType: 1,
        pageSize: {
            "width": 507993.6,
            "height": 285800.4
        },
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

let historyOrc
ipcMain.on("historyOrc", async () => {
    historyOrc = new BrowserWindow({
        width: 1080,
        height: 720,
        center: true,
        autoHideMenuBar: true,
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

ipcMain.on("back", () => {
    mainWin.loadFile(join(__dirname, "Screens", "EorT", "index.html"))
})

ipcMain.on("backMain", () => {
    mainWin.loadFile(join(__dirname, "Screens", "main", "index.html"))
})

ipcMain.on("backTo", () => {
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