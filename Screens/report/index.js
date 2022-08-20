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

function perform() {
    return localStorage.getItem("operations").split(",")
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

ipcRenderer.on("reportData", async (event, arg) => {
    let cc = {}
    await xlsxFile(arg).then((rows) => {
        for (i in rows) {
            if (rows[i][0] != null && !isNaN(rows[i][1])) cc[rows[i][0]] = rows[i][1]
        }
    })

    // console.log(cc)
    await fs.writeFileSync(join(__dirname, "..", "..", "cc.json"), JSON.stringify(cc))
    location.reload()

})

function info(text) {
    ipcRenderer.send("showMsg", [text, "Info"])
}

let totalMedio = 0
let totalMaximo = 0

window.onload = async () => {
    document.getElementById("imgAdd").addEventListener("click", async () => {
        let operations = perform()
        let data = fs.existsSync(join(__dirname, "..", "..", "temp.json")) ?
            JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "temp.json"))) :
            []

        data.push([
            localStorage.getItem("mpSelected"),
            localStorage.getItem("opt"),
            localStorage.getItem("qtde"),
            localStorage.getItem("totalMedio"),
            localStorage.getItem("totalMaximo")
        ])

        ipcRenderer.send("backTo")

        await fs.writeFileSync(join(__dirname, "..", "..", "temp.json"),
            JSON.stringify(data))
    })

    document.getElementById("imgNew").addEventListener("click", async () => {
        try {
            await fs.unlinkSync(join(__dirname, "..", "..", "temp.json"))
        }
        catch { }
        ipcRenderer.send("backTo")
    })

    document.getElementById("imgConfirm").addEventListener("click", async () => {
        localStorage.setItem("onlyView", 0)
        ipcRenderer.send("orcamentPDF")
    })

    document.getElementById("back").addEventListener("click", async () => {
        try {
            await fs.unlinkSync(join(__dirname, "..", "..", "temp.json"))
        }
        catch { }
        ipcRenderer.send("backOpera")
    })
    document.getElementById("help").addEventListener("click",
        () => info("Monte uma planilha com o seguinte formato: \n\nCentro de Custo (Coluna A) - Valor (Coluna B)"))
    if (!fs.existsSync(join(__dirname, "..", "..", "cc.json"))) {
        document.querySelector("table.table").style.display = "none"
        document.getElementById("title").textContent = "Importe os Centro de Custos"
    } else {
        document.getElementById("import").style.display = "none"
        document.getElementById("help").style.display = "none"
        let operations = perform()

        // MP
        let totalMP = 0

        await addText("mp", localStorage.getItem("mpSelected"))
        await addText("desc", localStorage.getItem("opt"))
        let preco = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..",
            localStorage.getItem("empresa") == "EMBAMED" ?
                "mpEmb.json" : "mpTerm.json")))
        await addText("rsuni", String(parseFloat(preco[localStorage.getItem("mpSelected")]).toFixed(2))
            .replace(".", ","))
        await addText("unid", "kg")
        await addText("qtde", String(parseFloat(localStorage.getItem("info").split(",")[1]).toFixed(4))
            .replace(".", ","), false)
        await addBr("conj")
        await addBr("conj")
        totalMP = parseFloat(preco[localStorage.getItem("mpSelected")] *
            parseFloat(localStorage.getItem("qtde")).toFixed(4)) * 1
        await addText("rstotal", "R$ " + String(totalMP.toFixed(4)).replace(".", ","))

        // espaçamento

        addText("conj", "Total MP:")
        addText("rstotal", "R$ " + String(totalMP.toFixed(4)).replace(".", ","))
        for (i = 0; i < 1; i++) {
            addBr("mp")
            addBr("desc")
            addBr("rsuni")
            addBr("unid")
            addBr("qtde")
        }

        // OPERATIONS

        addTitle("mp", "Operações", "opera")
        addTitle("desc", "Centro de Custos", "cc")
        addTitle("unid", "Média Hora", "hour")
        addTitle("qtde", "Hora Máxima", "hourM")
        addTitle("rsuni", "Taxa Hora MOD", "taxa")
        addTitle("conj", "Custo Médio", "medio")
        addTitle("rstotal", "Custo Máximo", "max")

        // console.log(localStorage.getItem("info"))

        operations = operations.sort()
        for (i in operations) {
            addText("opera", String(operations[i]).split(" - ")[0])
            addText("cc", await getCC(operations[i]))
            addText("hour", await tempo(operations[i], true))
            addText("hourM", await tempo(operations[i], false))
            addText("taxa", String("R$ " + parseFloat(await getValueCC(await getCC(operations[i]))).toFixed(2))
                .replace(".", ","))

            // console.log(operations[i])
            let custoMedio = parseFloat(await tempo(operations[i], true, true) *
                await getValueCC(await getCC(operations[i]))).toFixed(2)
            let custoMaximo = parseFloat(await tempo(operations[i], false, true) *
                await getValueCC(await getCC(operations[i]))).toFixed(2)

            totalMedio += parseFloat(custoMedio)
            totalMaximo += parseFloat(custoMaximo)
            // console.log(i)
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

        // console.log(totalMP)
        addText("taxa", "Total Geral: ")
        addText("medio", "R$ " + parseFloat(parseFloat(totalMP) + totalMedio).toFixed(2), false,
            true, "geralMedio")
        localStorage.setItem("totalMedio", parseFloat(totalMP) + totalMedio)
        addText("max", "R$ " + parseFloat(parseFloat(totalMP) + totalMaximo).toFixed(2), false,
            true, "geralMax")
        localStorage.setItem("totalMaximo", parseFloat(totalMP) + totalMaximo)

        addBr("taxa")
        addBr("medio")
        addBr("max")
        setInterval(() => {
            document.querySelector("p.geralMedio").textContent = "R$ " + String(parseFloat(parseFloat(totalMP) + totalMedio).toFixed(2))
                .replace(".", ",")
            document.querySelector("p.geralMax").textContent = "R$ " + String(parseFloat(parseFloat(totalMP) + totalMaximo).toFixed(2))
                .replace(".", ",")
        }, 1000);

        // console.log(totalMedio, totalMaximo)
    }
}