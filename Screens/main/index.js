const { ipcRenderer } = require("electron")
const fs = require('fs')
const { join } = require("path")

window.onload = () => {
    document.getElementById("newOrc").addEventListener("click", async () => {
        
        try {
            await fs.unlinkSync(join(__dirname, "..", "..", "temp.json"))
        } catch (err) { console.log(err) }
        localStorage.setItem("editItem", false)

        ipcRenderer.send("newOrc")
    })

    document.getElementById("import").addEventListener("click", () => {
        ipcRenderer.send("historyOrc")
    })
}