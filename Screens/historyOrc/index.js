const { ipcRenderer } = require('electron')
const fs = require('fs')
const { join } = require('path')

window.onload = async () => {
    let select = document.getElementById("orcs")
    let title = document.getElementById("title")

    if (fs.existsSync(join(__dirname, "..", "..", "orcamentos.json"))) {
        let data = JSON.parse(
            await fs.readFileSync(join(__dirname, "..", "..", "orcamentos.json")))

        for (i in data) {
            let opt = document.createElement("option")
            opt.textContent = i
            select.appendChild(opt)
        }
        
    } else {
        title.textContent = "Nenhum orçamento foi criado ainda"
        select.style.display = "none"
    }
}

function loadOrcament() {
    let select = document.getElementById('orcs');
    let selectValue = select.options[select.selectedIndex].textContent;

    if (selectValue != "") {
        localStorage.setItem("onlyView", 1)
        select.value = ""
        localStorage.setItem("idToView", parseInt(selectValue))
        ipcRenderer.send("loadOrcament")
    }
}