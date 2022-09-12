const { ipcRenderer } = require("electron");
const fs = require('fs');
const { join } = require("path");

// DOM load

window.onload = async () => {
    document.querySelector("div.showContent").style.display = "none"
    document.getElementById("materials").style.display = "none"
    document.querySelector("div.values").style.display = "none"
    addOption("Modificar")
    addOption("Adicionar")
    addOption("Higienizar")

    try {
        const rows = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
            "mpEmb.json" : "mpTerm.json")))

        for (i in rows) {
            addOption(i, "materials")
        }
    } catch { }

    document.getElementById("mps").addEventListener("change", () => loadOpt())

    document.getElementById("info").textContent = localStorage.getItem("empresa") == "EMBAMED" ?
        "Simples Nacional" : "Lucro Presumido"
}

document.addEventListener('keydown', function (event) {
    if (event.keyCode !== 13) return;

    if (actual == 1) importar()
    else if (actual == 2) actualizeMPValue()
    else if (actual == 3) actualizeHigValue()

})

// Auxiliar Functions

function addOption(txt, id = "mps") {
    let opt = document.createElement("option")
    opt.textContent = txt
    document.getElementById(id).appendChild(opt)
}

function error(text) {
    ipcRenderer.send("showError", ["Alerta", text])
}

function info(text) {
    ipcRenderer.send("showMsg", [text, "Info"])
}

async function actualizeHigValue() {
    let value = document.getElementById("value").value

    let data = []
    try {
        data = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "config.json")))
    } catch { }

    data["higi"] = parseFloat(value)
    document.getElementById("actualValueH").textContent = "Valor Atual: " + value

    await fs.writeFileSync(join(__dirname, "..", "..", "config.json"), JSON.stringify(data))
    document.getElementById("value").value = ""
}

// Main Functions
async function actualizeMPValue() {
    let select = document.getElementById('materials');
    let selectValue = select.options[select.selectedIndex].textContent;

    let newValueInput = document.getElementById("newValue")

    if (selectValue != "") {
        if (newValueInput != 0) {
            let path = join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
                "mpEmb.json" : "mpTerm.json")

            let preco = JSON.parse(await fs.readFileSync(path))
            preco[selectValue] = newValueInput.value

            info(`Valor atualizado com sucesso! ${selectValue}: ${newValueInput.value}`)

            await fs.writeFileSync(path, JSON.stringify(preco))

            select.value = ""
            document.getElementById("actualValue").textContent = ""
            newValueInput.value = null

        } else error("O valor não pode ser 0")
    }

}

async function loadOpt() {
    let select = document.getElementById('mps');
    let selectValue = select.options[select.selectedIndex].textContent;

    if (selectValue != "") {
        if (selectValue == "Adicionar") {
            document.getElementById("materials").style.display = "none"
            document.querySelector("div.showContent").style.display = "grid"
            document.querySelector("div.values").style.display = "none"
            document.getElementById("actualValueH").style.display = "none"
            document.getElementById("name").style.display = "grid"
            document.getElementById("lName").style.display = "grid"

            actual = 1
        } else if (selectValue == "Modificar") {
            document.getElementById("materials").style.display = "grid"
            document.querySelector("div.showContent").style.display = "none"
            document.querySelector("div.values").style.display = "grid"

            actual = 2

            document.getElementById("materials").addEventListener("change", () => loadValue())
        } else if (selectValue == "Higienizar") {
            document.getElementById("name").style.display = "none"
            document.getElementById("lName").style.display = "none"
            document.querySelector("div.values").style.display = "none"
            document.querySelector("div.showContent").style.display = "grid"
            document.getElementById("materials").style.display = "none"

            actual = 3
            try { data = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "config.json"))) }
            catch { }

            if (data["higi"] != undefined) {
                document.getElementById("actualValueH").style.display = "grid"
                document.getElementById("actualValueH").textContent = "Valor Atual: " + data["higi"]
            }
        }
    } else {
        actual = 0

        document.getElementById("materials").style.display = "none"
        document.querySelector("div.showContent").style.display = "none"
        document.querySelector("div.values").style.display = "none"
    }
}

async function loadValue() {
    let select = document.getElementById('materials');
    let selectValue = select.options[select.selectedIndex].textContent;
    let preco = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
        "mpEmb.json" : "mpTerm.json")))

    document.getElementById("actualValue").textContent = "Valor Atual: " + preco[selectValue][0]
}

async function importar() {
    let name = document.getElementById("name").value
    let value = document.getElementById("value").value

    if (name != undefined) {
        if (value != 0) {
            let path = join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
                "mpEmb.json" : "mpTerm.json")
            let data = {}

            if (fs.existsSync(path)) {
                try {
                    data = JSON.parse(await fs.readFileSync(path))
                } catch { }
            }
            name = String(name).toUpperCase()
            data[name] = [value, false]

            await fs.writeFileSync(path, JSON.stringify(data))
            info(`MP ${name} adicionada com sucesso!`)
            name.value = null
            value.value = null

            location.reload()
            ipcRenderer.send("reloadMesa")
        } else error("Insira um valor para a MP")
    } else error("Insira um nome para a MP")

}