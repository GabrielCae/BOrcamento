const { ipcRenderer } = require("electron")

window.onload = () => {
    document.getElementById("terme").addEventListener("click", () => {
        ipcRenderer.send("termeOrc")
        localStorage.setItem("empresa", "TERMEDIC")
    })

    document.getElementById("embam").addEventListener("click", () => {
        ipcRenderer.send("embamOrc")
        localStorage.setItem("empresa", "EMBAMED")
    })

    document.getElementById("back").addEventListener("click", () => {
        ipcRenderer.send("backMain")
    })
}