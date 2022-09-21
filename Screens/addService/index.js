const { ipcRenderer } = require("electron");
const fs = require('fs');
const { join } = require("path");

// DOM load

window.onload = async () => {
    document.title = "Serviços - " + localStorage.getItem("empresa")
    document.getElementById("title").textContent = localStorage.getItem("whatDo") == "a" ?
        "Adicionar Serviço" : localStorage.getItem("whatDo") == "m" ? "Modificar Serviço" :
            "Excluir Serviço"

    try {
        let info = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "services.json")))
        let j = 0

        for (i in info) j++

        if (j == 0) await fs.unlinkSync(join(__dirname, "..", "..", "services.json"))
    } catch { }

    document.querySelector("div.showContent").style.display = "none"
    document.getElementById("materials").style.display = "none"
    document.querySelector("div.values").style.display = "none"

    try {
        const rows = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
            "servicesEmb.json" : "servicesTerm.json")))

        for (i in rows) {
            addOption(i, "materials")
        }
    } catch { }

    loadOpt()

    document.getElementById("confirm").addEventListener("click", () => done())

    document.getElementById("info").textContent = localStorage.getItem("empresa") == "EMBAMED" ?
        "Simples Nacional" : "Lucro Presumido"
}

function done() {
    if (actual == 0) return

    if (actual == 1) addService()
    else if (actual == 2) actualizeServiceValue()
    else if (actual == 3) removeService()
}

// Auxiliar Functions

function addOption(txt, id) {
    let opt = document.createElement("option")
    opt.textContent = txt
    document.getElementById(id).appendChild(opt)
}

async function removeService() {
    let select = document.getElementById('materials');
    let value = select.options[select.selectedIndex].textContent;
    let json = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
        "servicesEmb.json" : "servicesTerm.json")))

    if (value != "") {
        for (i in json) {
            if (i === value) delete json[i]
        }
        json = JSON.stringify(json)
        await fs.writeFileSync(join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
            "servicesEmb.json" : "servicesTerm.json"), json)
        info(`Serviço ${value} deletado com sucesso!`)
        location.reload()
    }
}

function error(text) {
    ipcRenderer.send("showError", ["Alerta", text])
}

function info(text) {
    ipcRenderer.send("showMsg", [text, "Info"])
}

// -- Main Functions --
async function actualizeServiceValue() {
    let select = document.getElementById('materials');
    let selectValue = select.options[select.selectedIndex].textContent;

    let newValueInput = document.getElementById("newValue")

    if (selectValue != "") {
        if (newValueInput != 0) {
            let path = join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
                "servicesEmb.json" : "servicesTerm.json")

            let preco = JSON.parse(await fs.readFileSync(path))
            preco[selectValue] = newValueInput.value

            info(`Valor atualizado com sucesso! ${selectValue}: R$ ${newValueInput.value}`)

            await fs.writeFileSync(path, JSON.stringify(preco))

            select.value = ""
            document.getElementById("actualValue").textContent = ""
            newValueInput.value = null

        } else error("O valor não pode ser 0")
    }

}

async function loadOpt() {
    let selectValue = localStorage.getItem("whatDo") == "a" ?
        "Adicionar" : localStorage.getItem("whatDo") == "m" ? "Modificar" : "Excluir"
    console.log(selectValue)

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
        } else if (selectValue == "Excluir") {
            document.getElementById("materials").style.display = "grid"
            document.querySelector("div.showContent").style.display = "none"
            document.querySelector("div.values").style.display = "none"

            actual = 3

            document.getElementById("materials").addEventListener("change", () => loadValue())
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
    let preco = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..",
        localStorage.getItem("empresa") == "EMBAMED" ? "servicesEmb.json" : "servicesTerm.json")))

    console.log(preco[selectValue][0])

    document.getElementById("actualValue").textContent = "Valor Atual: R$ " + preco[selectValue]
}

async function addService() {
    let name = document.getElementById("name").value
    let value = document.getElementById("value").value

    if (name != undefined) {
        if (value != 0) {
            let path = join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
                "servicesEmb.json" : "servicesTerm.json")
            let data = {}

            if (fs.existsSync(path)) {
                try {
                    data = JSON.parse(await fs.readFileSync(path))
                } catch { }
            }
            name = String(name).toUpperCase()
            data[name] = value

            await fs.writeFileSync(path, JSON.stringify(data))
            info(`Serviço ${name} adicionada com sucesso!`)
            name.value = null
            value.value = null

            location.reload()
            // ipcRenderer.send("reloadMesa")
        } else error("Insira um valor para o Serviço")
    } else error("Insira um nome para o Serviço")

}