const { ipcRenderer } = require('electron')
const fs = require('fs')
const { join } = require('path')

window.onload = async () => {
    document.title = "Histórico de Orçamentos - "+localStorage.getItem("empresa")

    let select = document.getElementById("orcs")
    let title = document.getElementById("title")

    let path = localStorage.getItem("empresa") == "EMBAMED" ?
        join(__dirname, "..", "..", "orcamentosEmb.json") :
        join(__dirname, "..", "..", "orcamentosTerm.json")

    if (fs.existsSync(path)) {
        let data = JSON.parse(
            await fs.readFileSync(path))

        for (i in data) {
            let opt = document.createElement("option")
            opt.textContent = parseInt(i) + 1
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
        localStorage.setItem("idToView", parseInt(selectValue) - 1)
        ipcRenderer.send("loadOrcament")
    }
}