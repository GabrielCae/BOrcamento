const { ipcRenderer } = require('electron')
const fs = require('fs')
const { join } = require('path')

let orcament = []

async function addText(id, text, orc = true, classP = "") {
    let p = document.createElement("p")
    p.textContent = text

    if (classP != "") p.className = classP
    else p.className = id

    // console.log(localStorage.getItem("onlyView"))
    if (orc)
        orcament.push(text)

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

let id = 0

function isUpperCase(str) {
    return String(str) === String(str).toUpperCase();
}

function generatePDF() {
    ipcRenderer.send("searchPDF")
}

ipcRenderer.on("hideContent", (event, arg) => {
    if (arg != undefined) {
        document.getElementById("pdf").style.display = "none"

        ipcRenderer.send("emitPDF", arg)
    }
})

ipcRenderer.on("showContent", () => {
    ipcRenderer.send("showMsg", [
        "PDF Gerado com sucesso!",
        "info"
    ])
    document.getElementById("pdf").style.display = "grid"
})

window.onload = async () => {
    if (localStorage.getItem("onlyView") == 1) {
        let data = await JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "orcamentos.json")))
        let infos = []
        let totalMedio = 0
        let totalMaximo = 0

        for (i in data) {
            if (i == localStorage.getItem("idToView")) infos = data[i]
        }

        console.log(infos)

        for (i = 0; i < infos[0].length; i++) {
            if ((isNaN(infos[0][i]) && !String(infos[0][i]).startsWith("R$")
            && !String(infos[0][i]).startsWith("IPI")) &&
                isUpperCase(infos[0][i])) {
                addText("mp", infos[0][i], false)
                addText("desc", infos[0][i + 1], false)
                addText("rstotalmed", infos[0][i + 2], false)
                totalMedio += parseFloat(String(infos[0][i + 2]).replace("R$ ", ""))
                addText("rstotalmax", infos[0][i + 3], false)
                totalMaximo += parseFloat(String(infos[0][i + 3]).replace("R$ ", ""))
            }
        }

        addBr("rstotalmed")
        addBr("rstotalmax")
        addBr("desc")
        for (i = 0; i < 2; i++) {
            addBr("mp")
        }

        addText("desc", "Total: ", false)
        addText("rstotalmed", "R$ " + totalMedio.toFixed(2), false)
        addText("rstotalmax", "R$ " + totalMaximo.toFixed(2), false)

        document.getElementById("data").textContent = infos[1]
        document.getElementById("title").textContent = "Orçamento - " + localStorage.getItem("idToView")
    } else {
        if (fs.existsSync(join(__dirname, "..", "..", "orcamentos.json"))) {
            let data = await JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "orcamentos.json")))

            let lastId = 0
            for (i in data) {
                lastId = i
            }
            id = parseInt(lastId) + 1
            document.getElementById("title").textContent = "Orçamento - " + id
        } else document.getElementById("title").textContent = "Orçamento - 0"

        var data = new Date().toLocaleDateString();
        document.getElementById("data").textContent = data
        let totalMedio = 0
        let totalMaximo = 0

        addText("mp", localStorage.getItem("mpSelected"))
        addText("desc", localStorage.getItem("opt"))
        addText("rstotalmed", "R$ " + parseFloat(localStorage.getItem("pvMin"))
            .toFixed(2))
        totalMedio += parseFloat(localStorage.getItem("pvMin"))
        addText("rstotalmax", "R$ " + parseFloat(localStorage.getItem("pvMax"))
            .toFixed(2))
        totalMaximo += parseFloat(localStorage.getItem("pvMax"))

        if (fs.existsSync(join(__dirname, "..", "..", "temp.json"))) {
            let data = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "temp.json")))

            for (i in data) {
                addText("mp", data[i][0])
                addText("desc", data[i][1])
                addText("rstotalmed", "R$ " + parseFloat(data[i][3]).toFixed(2))
                totalMedio += parseFloat(data[i][3])
                addText("rstotalmax", "R$ " + parseFloat(data[i][4]).toFixed(2))
                totalMaximo += parseFloat(data[i][4])
            }

            // console.log(Array(operations).push("AA"))
        }

        // console.log(totalMedio, totalMaximo)
        addBr("rstotalmed")
        addBr("rstotalmax")
        addBr("desc")
        for (i = 0; i < 2; i++) {
            addBr("mp")
        }

        let ipi = parseFloat(localStorage.getItem("ipi"))/100

        addText("mp", "---")
        addText("desc", "IPI")
        addText("rstotalmed", "R$ "+(ipi*totalMedio).toFixed(2))
        addText("rstotalmax", "R$ "+(ipi*totalMaximo).toFixed(2))

        addText("desc", "Total: ", false)

        addText("rstotalmed", "R$ " + ((ipi*totalMedio)+totalMedio).toFixed(2), false)
        addText("rstotalmax", "R$ " + ((ipi*totalMaximo)+totalMaximo).toFixed(2), false)
        if (!fs.existsSync(join(__dirname, "..", "..", "orcamentos.json")))
            await fs.writeFileSync(join(__dirname, "..", "..", "orcamentos.json"),
                JSON.stringify({}))

        let json = await
            JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "orcamentos.json")))
        json[id] = [orcament, data, localStorage.getItem("ipi")]
        await fs.writeFileSync(join(__dirname, "..", "..", "orcamentos.json"), JSON.stringify(json))
    }

}