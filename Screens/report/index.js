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

function objectNull(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) return false;
    }
    return true;
}

function importar() {
    ipcRenderer.send("importar", "report")
}

ipcRenderer.on("reportData", async (event, arg) => {
    let cc = {}
    await xlsxFile(arg).then((rows) => {
        for (i in rows) {
            if (rows[i][0] != null && !isNaN(rows[i][1])) cc[rows[i][0]] = rows[i][1]
        }
    })

    await fs.writeFileSync(join(__dirname, "..", "..", "cc.json"), JSON.stringify(cc))
    location.reload()

})

function info(text) {
    ipcRenderer.send("showMsg", [text, "Info"])
}

let totalMedio = 0
let totalMaximo = 0

ipcRenderer.on("chooseR", (event, arg) => {
    if (arg == 0) {
        localStorage.setItem("useMax", 0)
        localStorage.setItem("useMed", 1)
        localStorage.setItem("totalGe", totalMedio)
    } else {
        localStorage.setItem("useMax", 1)
        localStorage.setItem("useMed", 0)
        localStorage.setItem("totalGe", totalMaximo)
    }


    ipcRenderer.send("markupScreen")
})

window.onload = async () => {
    document.title = "Preview - " + localStorage.getItem("empresa")

    document.getElementById("continue").addEventListener("click", () => {
        ipcRenderer.send("confirm", "chooseR",
            "Voc?? deseja usar o Custo M??dio ou o Custo M??ximo?", ["R$ M??dio", "R$ M??ximo"])
    })

    document.getElementById("back").addEventListener("click", async () => {
        ipcRenderer.send("chooseSer")
    })
    document.getElementById("help").addEventListener("click",
        () => info("Monte uma planilha com o seguinte formato: \n\nCentro de Custo (Coluna A) - Valor (Coluna B)"))
    if (!fs.existsSync(join(__dirname, "..", "..", "cc.json")) ||
        objectNull(JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "cc.json"))))) {
        document.querySelector("table.table").style.display = "none"
        document.getElementById("title").textContent = "Importe os Centro de Custos"
    } else {

        try {
            document.getElementById("import").style.display = "none"
            document.getElementById("help").style.display = "none"
            let operations = perform()
            let services = perform("services")

            // MP
            let totalMP = 0

            await addText("mp", localStorage.getItem("mpSelected"))
            await addText("desc", localStorage.getItem("opt"))
            let preco = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..",
                localStorage.getItem("empresa") == "EMBAMED" ?
                    "mpEmb.json" : "mpTerm.json")))
            await addText("rsuni", String("R$ " + parseFloat(preco[localStorage.getItem("mpSelected")][0]).toFixed(2))
                .replace(".", ","))
            await addText("unid", "kg")
            await addText("qtde", String(parseFloat(localStorage.getItem("info").split(",")[1]).toFixed(4))
                .replace(".", ","), false)
            await addBr("conj")
            await addBr("conj")
            totalMP = parseFloat(preco[localStorage.getItem("mpSelected")][0] *
                parseFloat(localStorage.getItem("qtde")).toFixed(4)) * 1
            await addText("rstotal", "R$ " + String(totalMP.toFixed(2)).replace(".", ","))

            if (services[0] != "") {
                let path = join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
                    "servicesEmb.json" : "servicesTerm.json")

                let config = JSON.parse(await fs.readFileSync(path))
                for (i in config) {
                    if (services.includes(i)) {
                        console.log(i)
                        await addBr("mp")
                        await addText("desc", i)
                        await addBr("rsuni", String("R$ " + parseFloat(config[i]).toFixed(2)).replace(".", ","))
                        await addBr("unid")
                        await addBr("qtde")
                        await addBr("conj")
                        totalMP += parseFloat(config[i])
                        await addText("rstotal", "R$ " + String(parseFloat(config[i]).toFixed(2)).replace(".", ","))

                    }
                }
                // console.log(config["higi"], config)
            }

            // espa??amento

            addText("conj", "Total MP:")
            addText("rstotal", "R$ " + String(totalMP.toFixed(2)).replace(".", ","))
            for (i = 0; i < 1; i++) {
                addBr("mp")
                addBr("desc")
                addBr("rsuni")
                addBr("unid")
                addBr("qtde")
            }

            // OPERATIONS

            addTitle("mp", "Opera????es", "opera")
            addTitle("desc", "Centro de Custos", "cc")
            addTitle("unid", "M??dia Hora", "hour")
            addTitle("qtde", "Hora M??xima", "hourM")
            addTitle("rsuni", "Taxa Hora MOD", "taxa")
            addTitle("conj", "Custo M??dio", "medio")
            addTitle("rstotal", "Custo M??ximo", "max")

            operations = operations.sort()
            for (i in operations) {
                addText("opera", String(operations[i]).split(" - ")[0])
                addText("cc", await getCC(operations[i]))
                addText("hour", await tempo(operations[i], true))
                addText("hourM", await tempo(operations[i], false))
                addText("taxa", String("R$ " + parseFloat(await getValueCC(await getCC(operations[i]))).toFixed(2))
                    .replace(".", ","))

                let custoMedio = parseFloat(await tempo(operations[i], true, true) *
                    await getValueCC(await getCC(operations[i]))).toFixed(2)
                let custoMaximo = parseFloat(await tempo(operations[i], false, true) *
                    await getValueCC(await getCC(operations[i]))).toFixed(2)

                totalMedio += parseFloat(custoMedio)
                totalMaximo += parseFloat(custoMaximo)
                addText("medio", "R$ " + String(custoMedio).replace(".", ","))
                addText("max", "R$ " + String(custoMaximo).replace(".", ","))
            }

            // GERAIS

            for (i = 0; i < 2; i++) {
                addBr("opera")
                addBr("cc")
                addBr("hour")
                addBr("hourM")
            }
            addBr("taxa")
            addBr("medio")
            addBr("max")

            addText("taxa", "Total MOD: ")
            addText("medio", "R$ " + String(parseFloat(totalMedio).toFixed(2))
                .replace(".", ","))
            addText("max", "R$ " + String(parseFloat(totalMaximo).toFixed(2))
                .replace(".", ","))

            for (i = 0; i < 2; i++) {
                addBr("opera")
                addBr("cc")
                addBr("hour")
                addBr("hourM")
            }

            addText("taxa", "Total Geral: ")
            addText("medio", "R$ " + parseFloat(parseFloat(totalMP) + totalMedio).toFixed(2), false,
                true, "geralMedio")
            addText("max", "R$ " + parseFloat(parseFloat(totalMP) + totalMaximo).toFixed(2), false,
                true, "geralMax")

            addBr("taxa")
            addBr("medio")
            addBr("max")
            document.querySelector("p.geralMedio").textContent = "R$ " + String(parseFloat(parseFloat(totalMP) + totalMedio).toFixed(2))
                .replace(".", ",")
            document.querySelector("p.geralMax").textContent = "R$ " + String(parseFloat(parseFloat(totalMP) + totalMaximo).toFixed(2))
                .replace(".", ",")
            totalMedio = parseFloat(totalMP) + totalMedio
            totalMaximo = parseFloat(totalMP) + totalMaximo
            console.log(totalMedio, totalMaximo)
        } catch {
            ipcRenderer.send("back")
        }

    }
}