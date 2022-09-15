// --- Imports ---
const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    globalShortcut,
    Menu
} = require('electron')
const { join, basename } = require('path')
const fs = require("fs")

// --- Screens Variables ---
let mainWin
let valueChangeWin
let historyOrc
let shopping
let empresa = ""

let options = {
    buttons: ["Mudar", "Cancelar"],
    message: "Tem certeza que deseja mudar a empresa?\nObs: O Trabalho não salvo será perdido"
}

let options2 = {
    buttons: ["Sim", "Não"],
    message: "Tem certeza que deseja começar um novo orçamento?"
}

let options3 = {
    buttons: ["Sim", "Não"],
    message: "Tem certeza que deseja importar as operações agora?\nObs: O Trabalho não salvo será perdido"
}

// --- Main Application ---
app.on("ready", (event) => {

    //--- Create Window ---
    mainWin = new BrowserWindow({
        width: 1460,
        height: 1000,
        center: true,
        show: true,
        maximizable: true,
        icon: join(__dirname, "assets/icon.png"),
        webPreferences: {
            nodeIntegration: true,
        },
    })

    //--- Menu ---
    const mainMenuTemplate = [
        {
            label: 'Empresa',
            submenu: [
                {
                    label: 'TERMEDIC', async click() {
                        if (empresa != "TERMEDIC") {
                            let response = await dialog.showMessageBoxSync(options)

                            if (response == 0) ipcMain.emit("termeOrc")
                        }
                    }
                },
                {
                    label: 'EMBAMED', async click() {
                        if (empresa != "EMBAMED") {
                            let response = await dialog.showMessageBoxSync(options)

                            if (response == 0) ipcMain.emit("embamOrc")
                        }
                    }
                }
            ]
        },
        {
            label: 'Cadastro',
            submenu: [
                {
                    label: 'MATÉRIA PRIMA',
                    submenu: [
                        {
                            label: 'ADICIONAR', async click() {
                                await mainWin.webContents.executeJavaScript(`ipcRenderer.send("importInfo", "a")`)
                            }
                        },
                        {
                            label: 'MODIFICAR', async click() {
                                await mainWin.webContents.executeJavaScript(`ipcRenderer.send("importInfo", "m")`)
                            }
                        }
                    ]
                },
                {
                    label: 'CENTRO DE CUSTO',
                },
                {
                    label: 'PROCESSOS', async click() {
                        let response = await dialog.showMessageBoxSync(options3)

                        if (response == 0) {
                            await mainWin.webContents.executeJavaScript("ipcRenderer.send('operations')")

                            await mainWin.webContents.executeJavaScript(`ipcRenderer.send("importar", "opera")`)
                            await mainWin.webContents.executeJavaScript(`ipcRenderer.send("back")`)
                            await mainWin.webContents.executeJavaScript(`ipcRenderer.send("showMsg", ["Operações importadas com sucesso!", "Info"])`)
                        }
                    }
                },
                {
                    label: 'SERVIÇOS',
                    submenu: [
                        {
                            label: 'Higienização', async click() {
                                await mainWin.webContents.executeJavaScript(`ipcRenderer.send("importInfo", "h")`)
                            }
                        }
                    ]
                },
                {
                    label: 'CLIENTES',
                }
            ]
        },
        {
            label: 'Orçamento',
            submenu: [
                {
                    label: 'NOVO', async click() {
                        let response = await dialog.showMessageBoxSync(options2)

                        if (response == 0) {
                            try {
                                await fs.unlinkSync(join(__dirname, "..", "..", "temp.json"))
                            }
                            catch { }

                            await mainWin.webContents.executeJavaScript(`localStorage.setItem("editItem", 0)`)
                            await mainWin.webContents.executeJavaScript(`ipcRenderer.send("backTo")`)
                        }
                    }
                },
                {
                    label: 'HISTÓRICO', async click() {
                        await mainWin.webContents.executeJavaScript(`ipcRenderer.send("historyOrc")`)
                    }
                }
            ]
        }
    ];
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);

    mainWin.webContents.openDevTools()

    //--- Shortcuts ---
    globalShortcut.register('CmdOrCtrl+=', () => {
        try {
            BrowserWindow.getFocusedWindow().webContents.setZoomLevel(
                BrowserWindow.getFocusedWindow().webContents.getZoomLevel() + 0.5
            )
        } catch { }
    })

    globalShortcut.register('CmdOrCtrl+-', () => {
        try {
            BrowserWindow.getFocusedWindow().webContents.setZoomLevel(
                BrowserWindow.getFocusedWindow().webContents.getZoomLevel() - 0.5
            )
        } catch { }
    })

    //--- Load Content ---
    mainWin.webContents.setZoomFactor(1, 5)
    mainWin.loadFile(join(__dirname, "Screens", "main", "index.html"))
})

// --- Ipc Events ---
ipcMain.on('getEmpresa', async (event) => {
    try {
        let info = JSON.parse(await fs.readFileSync(join(__dirname, "config.json")))
        let j = 0

        for (i in info) j++

        if (j == 0) await fs.unlinkSync(join(__dirname, "config.json"))
    } catch { }

    let data
    if (fs.existsSync(join(__dirname, "config.json"))) data = JSON.parse(await fs.readFileSync(join(__dirname, "config.json")))
    data["empresa"] = empresa
    await fs.writeFileSync(join(__dirname, "config.json"), JSON.stringify(data))
})

ipcMain.on("newOrc", () => {
    mainWin.loadFile(join(__dirname, "Screens", "main", "index.html"))
})

ipcMain.on("termeOrc", async () => {
    let data

    if (fs.existsSync(join(__dirname, "config.json")))
        data = JSON.parse(await fs.readFileSync(join(__dirname, "config.json")))

    data["empresa"] = "TERMEDIC"
    empresa = "TERMEDIC"
    await fs.writeFileSync(join(__dirname, "config.json"), JSON.stringify(data))

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

ipcMain.on("embamOrc", async () => {
    let data

    if (fs.existsSync(join(__dirname, "config.json")))
        data = JSON.parse(await fs.readFileSync(join(__dirname, "config.json")))

    data["empresa"] = "EMBAMED"
    empresa = "EMBAMED"
    await fs.writeFileSync(join(__dirname, "config.json"), JSON.stringify(data))

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

ipcMain.on("importInfo", async (event, args) => {
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

    valueChangeWin.webContents.openDevTools()
    await mainWin.webContents.executeJavaScript(`localStorage.setItem('whatDo', "${args}")`)

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
    mainWin.loadFile(join(__dirname, "Screens", "main", "index.html"))
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