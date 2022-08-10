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
        let json = {}
        json = await JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "config.json")))
        if (json["qtde"] == undefined) json["qtde"] = parseFloat(text)
        else if (json["conj"] == undefined) json["conj"] = parseFloat(text)
        await fs.writeFileSync(join(__dirname, "..", "..", "config.json"), JSON.stringify(json))
        json = await JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "config.json")))
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

window.onload = async () => {
    document.getElementById("back").addEventListener("click", () => ipcRenderer.send("backOpera"))
    document.getElementById("help").addEventListener("click",
        () => ipcRenderer.send("showMsg",
            ["Monte uma planilha com o seguinte formato: \n\nCentro de Custo (Coluna A) - Valor (Coluna B)", "Info"]))
    if (!fs.existsSync(join(__dirname, "..", "..", "cc.json"))) {
        document.querySelector("table.table").style.display = "none"
        document.getElementById("title").textContent = "Importe os Centro de Custos"
    } else {
        document.getElementById("import").style.display = "none"
        document.getElementById("help").style.display = "none"
        let operations = perform()

        // MP
        await addText("mp", "xxxxxx")
        await addText("desc", localStorage.getItem("mpSelected"))
        let preco = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
            "mpEmb.json" : "mpTerm.json")))
        await addText("rsuni", parseFloat(preco[localStorage.getItem("mpSelected")]).toFixed(2))
        await addText("unid", "kg")
        await addText("qtde", parseFloat(localStorage.getItem("info").split(",")[1]).toFixed(3), true)
        await addText("conj", 1, true)
        await addText("rstotal", "R$ " + 0)

        let totalMP = 0

        setInterval(async () => {
            let json = {}
            if (fs.existsSync(join(__dirname, "..", "..", "config.json"))) {
                json = await JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "config.json")))
            }
            document.querySelector("p.qtde").textContent = parseFloat(json["qtde"]).toFixed(3)
            document.querySelector("p.conj").textContent = parseFloat(json["conj"]).toFixed(0)

            totalMP = parseFloat((preco[localStorage.getItem("mpSelected")] * parseFloat(json["qtde"]).toFixed(4))
                * parseFloat(json["conj"]).toFixed(4)).toFixed(2)
            console.log(totalMP)
            document.querySelector("p.rstotal").textContent = "R$ " + totalMP
        }, 1000)

        // espaçamento

        addBr("mp")
        addBr("desc")
        addBr("rsuni")
        addBr("unid")
        addBr("qtde")
        addBr("conj")
        addBr("rstotal")

        // OPERATIONS

        addTitle("mp", "Operações", "opera")
        addTitle("desc", "Centro de Custos", "cc")
        addTitle("rsuni", "Horas Médias", "hour")
        addTitle("unid", "Horas Máximas", "hourM")
        addTitle("qtde", "Taxa Hora MOD", "taxa")
        addTitle("conj", "Custo Médio", "medio")
        addTitle("rstotal", "Custo Máximo", "max")

        // console.log(localStorage.getItem("info"))
        let totalMedio = 0
        let totalMaximo = 0

        operations = operations.sort()
        for (i in operations) {
            addText("opera", operations[i])
            addText("cc", await getCC(operations[i]))
            addText("hour", await tempo(operations[i], true))
            addText("hourM", await tempo(operations[i], false))
            addText("taxa", "R$ " + parseFloat(await getValueCC(await getCC(operations[i]))).toFixed(2))
            // console.log(tempo(operations[i], true, true))

            let custoMedio = parseFloat(await tempo(operations[i], true, true) *
                await getValueCC(await getCC(operations[i]))).toFixed(2)
            let custoMaximo = parseFloat(await tempo(operations[i], false, true) *
                await getValueCC(await getCC(operations[i]))).toFixed(2)

            totalMedio += parseFloat(custoMedio)
            totalMaximo += parseFloat(custoMaximo)
            addText("medio", "R$ " + custoMedio)
            addText("max", "R$ " + custoMaximo)
            // console.log(Array(localStorage.getItem("operations")))
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
        addText("medio", "R$ " + parseFloat(totalMedio).toFixed(2))
        addText("max", "R$ " + parseFloat(totalMaximo).toFixed(2))


        for (i = 0; i < 2; i++) {
            addBr("opera")
            addBr("cc")
            addBr("hour")
            addBr("hourM")
        }

        console.log(totalMP)
        addText("taxa", "Total Geral: ")
        addText("medio", "R$ " + parseFloat(parseFloat(totalMP) + totalMedio).toFixed(2), false,
            true, "geralMedio")
        addText("max", "R$ " + parseFloat(parseFloat(totalMP) + totalMaximo).toFixed(2), false,
            true, "geralMax")
        addBr("taxa")
        addBr("medio")
        addBr("max")
        setInterval(() => {
            document.querySelector("p.geralMedio").textContent = "R$ " + parseFloat(parseFloat(totalMP) + totalMedio).toFixed(2)
            document.querySelector("p.geralMax").textContent = "R$ " + parseFloat(parseFloat(totalMP) + totalMaximo).toFixed(2)
        }, 1000);

        console.log(totalMedio, totalMaximo)
    }
}