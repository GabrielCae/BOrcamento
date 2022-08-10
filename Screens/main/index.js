const { ipcRenderer } = require("electron")

window.onload = () => {
    document.getElementById("newOrc").addEventListener("click", () => {
        ipcRenderer.send("newOrc")
    })

    document.getElementById("import").addEventListener("click", () => {
        ipcRenderer.send("historyOrc")
    })
}