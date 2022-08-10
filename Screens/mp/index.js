const { ipcRenderer } = require("electron")
const xlsxFile = require('read-excel-file/node');
const fs = require("fs")
const { join } = require("path")

window.onload = () => {
    document.getElementById("import").addEventListener("click", () => {
        ipcRenderer.send("importar", "MP")
    })
}

ipcRenderer.on("mpData", async (event, arg) => {
    let json = {}
    if (fs.existsSync(join(__dirname, "..", "..", "config.json"))) {
        json = await JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "config.json")))
    }
    while (String(arg).includes("\\")) arg = String(arg).replace("\\", "/")
    json["MP"] = arg
    await fs.writeFileSync(join(__dirname, "..", "..", "config.json"), JSON.stringify(json))
    let mp = {}

    await xlsxFile(arg).then((rows) => {
        for (i in rows) mp[rows[i][0]] = rows[i][1]
    })
    await fs.writeFileSync(join(__dirname, "..", "..", "mp.json"), JSON.stringify(mp))
})