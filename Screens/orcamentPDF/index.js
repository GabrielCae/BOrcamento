const { ipcRenderer } = require('electron')
const fs = require('fs')
const { join } = require('path')

let orcament = []

async function addText(id, text, orc = true, rmvEdit = false, classP = "") {
    let div = document.createElement("div")
    div.className = "tableDivs"

    if (rmvEdit) {
        let img = document.createElement("img")
        img.src = "../../assets/dButtonVermei.png"
        img.id = "rmv"
        div.appendChild(img)

        img.className = classP
        img.addEventListener("click", e => removeMP(e.target.className))

        img = document.createElement("img")
        img.src = "../../assets/edit.png"
        img.id = "edit"
        img.className = classP
        div.appendChild(img)

        img.addEventListener("click", e => editMP(e.target.className))
    }
    let p = document.createElement("p")
    p.textContent = text

    if (classP != "") p.className = classP
    else p.className = id

    div.appendChild(p)

    // console.log(localStorage.getItem("onlyView"))
    if (orc)
        orcament.push(text)

    document.getElementById(id).appendChild(div)
}

async function addTitle(id, text, className) {
    let p = document.createElement("p")

    p.textContent = text
    p.className = "title"
    p.id = className

    document.getElementById(id).appendChild(p)
}

function perform(info = "operations") {
    return localStorage.getItem(info).split(",")
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

async function removeMP(className) {
    let data = await JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "orcamentos.json")))
    // console.log(data)
    let newData = []

    for (i in data) {
        if (i == localStorage.getItem("idToView")) {
            newData = [data[i][0], data[i][1], data[i][2]]
            newData[0].splice(className, 4)
            console.log(className, newData)
            // break
        }
    }

    data[localStorage.getItem("idToView")] = newData
    await fs.writeFileSync(join(__dirname, "..", "..", "orcamentos.json"), JSON.stringify(data))
    location.reload()
}

async function editMP(className) {
    localStorage.setItem("editItem", 2)
    localStorage.setItem("editId", id)
    localStorage.setItem("editName", className)

    ipcRenderer.send("backTo")
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
        let j = 0

        for (i = 0; i < infos[0].length; i++) {
            if ((isNaN(infos[0][i]) && !String(infos[0][i]).startsWith("R$")
                && !String(infos[0][i]).startsWith("IPI")) &&
                isUpperCase(infos[0][i]) && !Array.isArray(infos[0][i])) {

                if (!String(infos[0][i + 1]).startsWith("IPI")) {
                    addText("id", j, false)
                    j++
                }
                addText("mp", infos[0][i], false, String(infos[0][i]) != "---", i)
                addText("desc", infos[0][i + 1], false)
                addText("rstotalmed", !String(infos[0][i + 2]).startsWith("R$ ") ?
                    "R$ " + infos[0][i + 2] :
                    infos[0][i + 2], false)
                totalMedio += parseFloat(String(infos[0][i + 2]).replace("R$ ", ""))
                addText("rstotalmax", !String(infos[0][i + 3]).startsWith("R$ ") ?
                "R$ " + infos[0][i + 3] :
                infos[0][i + 3], false, false)
                totalMaximo += parseFloat(String(infos[0][i + 3]).replace("R$ ", ""))

            }
        }

        addBr("rstotalmed")
        addBr("rstotalmax")
        addBr("desc")
        addBr("id")
        for (i = 0; i < 2; i++) {
            addBr("mp")
            addBr("id")
        }

        addText("desc", "Total: ", false)
        addText("rstotalmed", "R$ " + totalMedio.toFixed(2), false)
        addText("rstotalmax", "R$ " + totalMaximo.toFixed(2), false)

        document.getElementById("data").textContent = infos[1]
        document.getElementById("title").textContent = "Orçamento - " + localStorage.getItem("idToView")
    } else {
        localStorage.setItem("idToView", "")
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

        if (localStorage.getItem("mpSelected") != "" && localStorage.getItem("operations") != "" &&
            localStorage.getItem("pvMin") != "") {
            addText("id", 0, false)
            addText("mp", localStorage.getItem("mpSelected"), true, true, 0)
            addText("desc", localStorage.getItem("opt"))
            addText("rstotalmed", "R$ " + parseFloat(localStorage.getItem("pvMin"))
                .toFixed(2))
            totalMedio += parseFloat(localStorage.getItem("pvMin"))
            addText("rstotalmax", "R$ " + parseFloat(localStorage.getItem("pvMax"))
                .toFixed(2))
            totalMaximo += parseFloat(localStorage.getItem("pvMax"))
            orcament.push(perform())
            orcament.push(perform("info"))
        }

        if (fs.existsSync(join(__dirname, "..", "..", "temp.json"))) {
            let data = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "temp.json")))

            for (i in data) {
                addText("id", parseFloat(i) + 1, false)
                addText("mp", data[i][0], true, true, parseFloat(i) + 1)
                addText("desc", data[i][1])
                addText("rstotalmed", "R$ " + parseFloat(data[i][3]).toFixed(2))
                totalMedio += parseFloat(data[i][3])
                addText("rstotalmax", "R$ " + parseFloat(data[i][4]).toFixed(2))
                totalMaximo += parseFloat(data[i][4])
                orcament.push(data[i][5])
                orcament.push(data[i][6])
            }

            // console.log(Array(operations).push("AA"))
        }

        // console.log(totalMedio, totalMaximo)
        addBr("rstotalmed")
        addBr("rstotalmax")
        addBr("desc")
        addBr("id")
        for (i = 0; i < 2; i++) {
            addBr("id")
            addBr("mp")
        }

        let ipi = parseFloat(localStorage.getItem("ipi")) / 100

        addText("mp", "---")
        addText("desc", "IPI")
        addText("rstotalmed", "R$ " + (ipi * totalMedio).toFixed(2))
        addText("rstotalmax", "R$ " + (ipi * totalMaximo).toFixed(2))

        addText("desc", "Total: ", false)

        addText("rstotalmed", "R$ " + ((ipi * totalMedio) + totalMedio).toFixed(2), false)
        addText("rstotalmax", "R$ " + ((ipi * totalMaximo) + totalMaximo).toFixed(2), false)
        if (!fs.existsSync(join(__dirname, "..", "..", "orcamentos.json")))
            await fs.writeFileSync(join(__dirname, "..", "..", "orcamentos.json"),
                JSON.stringify({}))

        let json = await
            JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "orcamentos.json")))
        json[id] = [orcament, data, localStorage.getItem("ipi")]
        await fs.writeFileSync(join(__dirname, "..", "..", "orcamentos.json"), JSON.stringify(json))
    }

}