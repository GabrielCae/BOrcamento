const { ipcRenderer } = require("electron");
const fs = require("fs");
const { join, parse } = require("path");
const xlsxFile = require('read-excel-file/node')

async function getCC(opera) {
    let data = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "operacoes.json")))

    return data[opera][0]
}

async function getValueCC(cc) {
    let data = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "cc.json")))

    // console.log(data[cc])
    return data[cc]
}

async function tempo(opera, nmax, dec = false) {
    let data = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "operacoes.json")))

    if (!dec) {
        if (nmax) return data[opera][4]
        else return data[opera][5]
    } else {
        if (nmax) return data[opera][1]
        else return data[opera][3]
    }
}

function perform(info = "operations") {
    return localStorage.getItem(info).split(",")
}

async function addText(id, text, mod = false, personalizedClass = false, classP = "") {
    let p = document.createElement("p")
    p.textContent = text

    if (personalizedClass) p.className = classP
    else p.className = id

    if (mod) {
        p.id = "mod"
        localStorage.setItem(id, 0)

        p.addEventListener("click", async (e) => {
            localStorage.setItem("modify", e.target.className)
            ipcRenderer.send("modifyInfo")
        })
    }

    document.getElementById(id).appendChild(p)
}

async function addTitle(id, text, className) {
    let p = document.createElement("p")

    p.textContent = text
    p.className = "title"
    p.id = className

    document.getElementById(id).appendChild(p)
}

async function addBr(id) {
    let p = document.createElement("p")

    p.textContent = "---"
    p.className = "br"

    document.getElementById(id).appendChild(p)
}

function importar() {
    ipcRenderer.send("importar", "report")
}

function info(text) {
    ipcRenderer.send("showMsg", [text, "Info"])
}

function calc() {
    let markup = 1 - (parseFloat(document.getElementById("pis").value) / 100 +
        parseFloat(document.getElementById("ir").value) / 100 +
        parseFloat(document.getElementById("icms").value) / 100 + parseFloat(document.getElementById("mc").value) / 100)

    // if (markup < 0) markup *= -1

    let pvMax = parseFloat(localStorage.getItem("totalMaximo") / markup).toFixed(2)
    let pvMin = parseFloat(localStorage.getItem("totalMedio") / markup).toFixed(2)

    localStorage.setItem("pvMax", pvMax)
    localStorage.setItem("pvMin", pvMin)

    document.getElementById("custoMeMark").textContent = "Preço Mínimo: R$ " + pvMin
    document.getElementById("custoMaxMark").textContent = "Preço Máximo: R$ " + pvMax
    document.getElementById("markup").textContent = "Markup: " + markup.toFixed(4)
}

let totalMedio = 0
let totalMaximo = 0
let show = false

let path
let impPath

window.onload = async () => {

    document.title = "Markup - " + localStorage.getItem("empresa")
    path = localStorage.getItem("empresa") == "EMBAMED" ?
        join(__dirname, "..", "..", "orcamentosEmb.json") :
        join(__dirname, "..", "..", "orcamentosTerm.json")

    impPath = localStorage.getItem("empresa") == "EMBAMED" ?
        join(__dirname, "..", "..", "impostosEmb.json") :
        join(__dirname, "..", "..", "impostosTerm.json")

    if (fs.existsSync(impPath)) {
        let data = JSON.parse(fs.readFileSync(impPath))

        document.getElementById("pis").value = data["pis"]
        document.getElementById("ir").value = data["ir"]
        document.getElementById("icms").value = data["icms"]
        document.getElementById("mc").value = data["mc"]
        document.getElementById("ipi").value = data["ipi"]
    }

    document.getElementById("custoMe").textContent = "Custo Médio: R$ " + parseFloat(localStorage.getItem("totalMedio")).toFixed(2)
    document.getElementById("custoMax").textContent = "Custo Máximo: R$ " + parseFloat(localStorage.getItem("totalMaximo")).toFixed(2)

    if (localStorage.getItem("useMed") == 0)
        document.querySelector("div.custoMeee").style.display = "none"
    if (localStorage.getItem("useMax") == 0){
        document.querySelector("div.custoMaxx").style.display = "none"
        document.querySelector("div.custoMeee").style.marginRight = "0px"
    }

    setInterval(() => {

        let inputs = document.querySelectorAll("input");
        inputs.forEach(i => {
            // console.log(i.value)
            if (i.value != 0 && i.value != "") show = true
            else show = false
        })
        if (show) calc()
        else {
            document.getElementById("custoMeMark").textContent = ""
            document.getElementById("custoMaxMark").textContent = ""
            document.getElementById("markup").textContent = ""
        }

    }, 500);

    if (localStorage.getItem("editItem") != 0) {
        document.querySelector("p.adddd").textContent = "Atualizar Item"
        document.getElementById("confirm").style.display = "none"
        document.getElementById("new").style.display = "none"
    }

    document.getElementById("add").addEventListener("click", async () => {
        if (!show) return

        let operations = perform()
        let services = perform("services")

        if (localStorage.getItem("editItem") != 0) {
            let data = JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "temp.json")))
            if (localStorage.getItem("editItem") == 1) {
                data.splice(localStorage.getItem("editId"), 1)
                console.log(data, localStorage.getItem("editId"), localStorage.getItem("editItem"))

                localStorage.setItem("editItem", 0)
                await fs.writeFileSync(join(__dirname, "..", "..", "temp.json"), JSON.stringify(data))
            } else {

                let baseData = JSON.parse(fs.readFileSync(path))
                let mp = parseFloat(localStorage.getItem("mpp"))

                baseData[localStorage.getItem("editId")][0][mp + 2] = localStorage.getItem("pvMin")

                baseData[localStorage.getItem("editId")][0][mp + 3] =
                    parseFloat((localStorage.getItem("pvMin")) * (parseFloat(document.getElementById("ipi").value) / 100)).toFixed(2)
                baseData[localStorage.getItem("editId")][0][mp + 4] =
                    parseFloat((localStorage.getItem("pvMax")) * (parseFloat(document.getElementById("ipi").value) / 100)).toFixed(2)

                baseData[localStorage.getItem("editId")][0][mp + 5] = localStorage.getItem("pvMax")
                baseData[localStorage.getItem("editId")][0][mp + 6] = operations
                baseData[localStorage.getItem("editId")][0][mp + 8] = perform("services")
                baseData[localStorage.getItem("editId")][0][mp + 7] = perform("infos")

                console.log(baseData)
                await fs.writeFileSync(path,
                    JSON.stringify(baseData))

                localStorage.setItem("onlyView", 1)
                localStorage.setItem("idToView", localStorage.getItem("editId"))
                ipcRenderer.send("orcamentPDF")

            }
        }

        let json = {
            pis: parseFloat(document.getElementById("pis").value),
            ir: parseFloat(document.getElementById("ir").value),
            icms: parseFloat(document.getElementById("icms").value),
            mc: parseFloat(document.getElementById("mc").value),
            ipi: parseFloat(document.getElementById("ipi").value)
        }
        await fs.writeFileSync(impPath, JSON.stringify(json))

        if (localStorage.getItem("editItem") < 2) {
            if (localStorage.getItem("add") == 0) {
                let data = fs.existsSync(join(__dirname, "..", "..", "temp.json")) ?
                    JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "temp.json"))) :
                    []

                data.push([
                    localStorage.getItem("mpSelected"),
                    localStorage.getItem("opt"),
                    localStorage.getItem("qtde"),
                    localStorage.getItem("pvMin"),
                    localStorage.getItem("pvMax"),
                    operations,
                    perform("infos"),
                    services,
                    parseFloat(document.getElementById("ipi").value)
                ])

                localStorage.setItem("operations", "")
                localStorage.setItem("mpSelected", "")
                localStorage.setItem("opt", "")
                localStorage.setItem("qtde", "")
                localStorage.setItem("pvMin", "")
                localStorage.setItem("services", "")
                localStorage.setItem("pvMax", "")

                ipcRenderer.send("openShop")
                localStorage.setItem("noQuest", 1)

                await fs.writeFileSync(join(__dirname, "..", "..", "temp.json"),
                    JSON.stringify(data))
            } else {
                let data = JSON.parse(await fs.readFileSync(path))

                let i = 0
                for (j in data[localStorage.getItem("editId")][0]) i++
                data[localStorage.getItem("editId")][0][i] = localStorage.getItem("mpSelected")
                data[localStorage.getItem("editId")][0][i + 1] = localStorage.getItem("opt")
                data[localStorage.getItem("editId")][0][i + 2] = parseFloat(localStorage.getItem("pvMin")).toFixed(2)

                let ipiTemp = ((localStorage.getItem("ipi")) / 100 * localStorage.getItem("pvMin"))
                data[localStorage.getItem("editId")][0][i + 3] = ipiTemp.toFixed(2)

                data[localStorage.getItem("editId")][0][i + 5] = parseFloat(localStorage.getItem("pvMax")).toFixed(2)

                ipiTemp = ((localStorage.getItem("ipi")) / 100 * localStorage.getItem("pvMax"))
                data[localStorage.getItem("editId")][0][i + 4] = ipiTemp.toFixed(2)

                data[localStorage.getItem("editId")][0][i + 6] = operations
                console.log(perform("infos"))
                data[localStorage.getItem("editId")][0][i + 7] = perform("infos")
                data[localStorage.getItem("editId")][0][i + 8] = perform("services")

                console.log(data[localStorage.getItem("editId")], localStorage.getItem("editId"))
                await fs.writeFileSync(path, JSON.stringify(data))
                localStorage.setItem("add", 0)

                localStorage.setItem("onlyView", 1)
                localStorage.setItem("idToView", localStorage.getItem("editId"))
                ipcRenderer.send("loadOrcament")
            }
        } else ipcRenderer.send("backMain")
    })

    document.getElementById("new").addEventListener("click", async () => {
        if (!show) return

        if (localStorage.getItem("add") == 1) {
            ipcRenderer.send("confirm", "newOrAdd",
                `Deseja adicionar o item ao orçamento existente (Orçamento: ${parseInt(localStorage.getItem("editId")) + 1}) ou deseja criar um novo?\nObs: Ao criar um novo, este item será perdido e, caso queira, terá que recriá-lo mais tarde.`,
                ["Adicionar", "Novo", "Cancelar"])
            return
        }
        try {
            await fs.unlinkSync(join(__dirname, "..", "..", "temp.json"))
        }
        catch { }

        let json = {
            pis: parseFloat(document.getElementById("pis").value),
            ir: parseFloat(document.getElementById("ir").value),
            icms: parseFloat(document.getElementById("icms").value),
            mc: parseFloat(document.getElementById("mc").value),
            ipi: parseFloat(document.getElementById("ipi").value)
        }
        await fs.writeFileSync(impPath, JSON.stringify(json))

        localStorage.setItem("noQuest", 0)
        localStorage.setItem("editItem", 0)
        ipcRenderer.send("backTo")
    })

    document.getElementById("confirm").addEventListener("click", async () => {
        if (localStorage.getItem("add") == 1) {
            ipcRenderer.send("confirm", "confirmOrAdd",
                `Deseja adicionar o item ao orçamento existente (Orçamento: ${parseInt(localStorage.getItem("editId")) + 1}) ou a um novo?`,
                ["Adicionar", "Novo", "Cancelar"])
            return
        }
        localStorage.setItem("ipi", document.getElementById("ipi").value)
        localStorage.setItem("onlyView", 0)
        ipcRenderer.send("closeShop")
        ipcRenderer.send("backMain")
        ipcRenderer.send("orcamentPDF")
    })

    document.getElementById("back").addEventListener("click", async () => {
        try {
            await fs.unlinkSync(join(__dirname, "..", "..", "temp.json"))
        }
        catch { }
        ipcRenderer.send("report")
    })
}

// --- IPC Events ---
ipcRenderer.on("confirmOrAdd", (event, rsp) => {
    console.log(rsp)
    if (rsp == 0) document.getElementById("add").click()
    else if (rsp == 1) {
        localStorage.setItem("add", 0)
        document.getElementById("confirm").click()
    }
})

ipcRenderer.on("newOrAdd", (event, rsp) => {
    console.log(rsp)
    if (rsp == 0) document.getElementById("add").click()
    else if (rsp == 1) {
        localStorage.setItem("add", 0)
        document.getElementById("new").click()
    }
})