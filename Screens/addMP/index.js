const { ipcRenderer } = require("electron");
const fs = require('fs');
const { join } = require("path");

window.onload = () => {
    document.getElementById("info").textContent = localStorage.getItem("empresa") == "EMBAMED" ?
        "Simples Nacional" : "Lucro Presumido"
}

document.addEventListener('keydown', function (event) {
    if (event.keyCode !== 13) return;
    importar()
})

async function importar() {
    let name = document.getElementById("name").value
    let value = document.getElementById("value").value

    if (name != undefined) {
        if (value != 0) {
            let data = {}
            if (fs.existsSync(join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
                "mpEmb.json" : "mpTerm.json"))) {
                try {
                    data = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
                        "mpEmb.json" : "mpTerm.json")))
                } catch { }
            }
            name = String(name).toUpperCase()
            data[name] = value
            await fs.writeFileSync(join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
                "mpEmb.json" : "mpTerm.json"), JSON.stringify(data))
            alert(`MP ${name} adicionada com sucesso!`)
            location.reload()
            ipcRenderer.send("reloadMesa")
        } else alert("Insira um valor para a MP")
    } else alert("Insira um nome para a MP")

}