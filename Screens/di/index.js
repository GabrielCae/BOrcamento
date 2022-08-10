const { ipcRenderer } = require("electron")
const fs = require("fs")
const { join } = require("path")
const xlsxFile = require("read-excel-file/node")

window.onload = () => {
    document.getElementById("import").addEventListener("click", () => {
        ipcRenderer.send("importar", "DI")
    })
}

ipcRenderer.on("diData", async (event, arg) => {
    let json = {}
    if (fs.existsSync(join(__dirname, "..", "..", "config.json"))) {
        json = await JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "config.json")))
    }
    json["path"] = arg
    while (String(arg).includes("\\")) arg = String(arg).replace("\\", "/")
    await fs.writeFileSync(join(__dirname, "..", "..", "config.json"), JSON.stringify(json))
    let opera = {}

    await xlsxFile(arg).then((rows) => {
        for (i in rows) {
            if (!isNaN(rows[i][1]) && rows[i][1] != null && !isNaN(rows[i][4])) {
                if (opera[rows[i][2]] == undefined) opera[rows[i][2]] = rows[i][4]
                else {
                    opera[rows[i][2]] = parseFloat((rows[i][4] + opera[rows[i][2]]) / 2)
                    // console.log(opera[rows[i][2]], rows[i][4], opera[rows[i][2]])
                }
            }
        }
    })
    // console.log(opera)
    await fs.writeFileSync(join(__dirname, "..", "..", "operacoes.json"), JSON.stringify(opera))
})