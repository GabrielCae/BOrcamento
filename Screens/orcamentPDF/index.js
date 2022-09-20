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
        if ((localStorage.getItem("onlyView") == 1) ? i == localStorage.getItem("idToView") :
            i == id) {
            // console.log(data)
            newData = [data[i][0], data[i][1], data[i][2]]
            if (localStorage.getItem("onlyView") == 0)
                className = 0 + (parseFloat(className) - 1) * 9

            newData[0].splice(className, 9)
        }
    }

    data[localStorage.getItem("onlyView") == 1 ? localStorage.getItem("idToView") : id] = newData
    console.log(data)
    await fs.writeFileSync(join(__dirname, "..", "..", "orcamentos.json"), JSON.stringify(data))
    if (localStorage.getItem("onlyView") == 0) {
        localStorage.setItem("onlyView", 1)
        localStorage.setItem("idToView", id)
    }
    location.reload()
}

async function editMP(className) {
    localStorage.setItem("editItem", 2)
    localStorage.setItem("editId", localStorage.getItem("onlyView") == 1 ?
        localStorage.getItem("idToView")
        : id)
    localStorage.setItem("editName", className)

    ipcRenderer.send("backTo")
}

async function addMP(className) {
    localStorage.setItem("editItem", 0)
    localStorage.setItem("editId", localStorage.getItem("onlyView") == 1 ?
        localStorage.getItem("idToView")
        : id)
    localStorage.setItem("editName", "")
    localStorage.setItem("add", 1)

    ipcRenderer.send("backTo")
}

ipcRenderer.on("hideContent", (event, arg) => {
    if (arg != undefined) {
        document.getElementById("pdf").style.display = "none"

        let img = document.querySelectorAll("img");
        img.forEach(i => {
            if (i.id == "rmv" || i.id == "edit") {
                console.log(i)
                i.style.display = "none"
            }
        })

        document.getElementById("rmv").style.display = "none"
        document.getElementById("edit").style.display = "none"

        ipcRenderer.send("emitPDF", arg)
    }
})

ipcRenderer.on("showContent", () => {
    ipcRenderer.send("showMsg", [
        "PDF Gerado com sucesso!",
        "info"
    ])

    let img = document.querySelectorAll("img");
    img.forEach(i => {
        if (i.id == "rmv" || i.id == "edit") {
            console.log(i)
            i.style.display = "flex"
        }
    })

    document.getElementById("pdf").style.display = "grid"
    document.getElementById("rmv").style.display = "flex"
    document.getElementById("edit").style.display = "flex"
})

window.onload = async () => {
    document.getElementById("imgNew").addEventListener("click", () => addMP());

    document.title = localStorage.getItem("empresa") != undefined ||
        localStorage.getItem("empresa") != "" ? "Orçamento - " + localStorage.getItem("empresa") : "Orçamento"

    let totalMedio = 0
    let totalMaximo = 0
    let ipiMax = 0
    let ipiMedio = 0

    if (localStorage.getItem("onlyView") == 1) {
        let data = await JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "orcamentos.json")))
        let infos = []

        for (i in data) {
            if (i == localStorage.getItem("idToView")) infos = data[i]
        }

        // console.log(infos)
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

                addText("ipimed", !String(infos[0][i + 3]).startsWith("R$ ") ?
                    "R$ " + infos[0][i + 3] :
                    infos[0][i + 3], false)
                ipiMedio += parseFloat(String(infos[0][i + 3]).replace("R$ ", ""))

                addText("ipimax", !String(infos[0][i + 4]).startsWith("R$ ") ?
                    "R$ " + infos[0][i + 4] :
                    infos[0][i + 4], false, false)
                ipiMax += parseFloat(String(infos[0][i + 4]).replace("R$ ", ""))

                addText("rstotalmax", !String(infos[0][i + 5]).startsWith("R$ ") ?
                    "R$ " + infos[0][i + 5] :
                    infos[0][i + 5], false, false)
                totalMaximo += parseFloat(String(infos[0][i + 5]).replace("R$ ", ""))

            }
        }

        addBr("rstotalmed")
        addBr("rstotalmax")
        addBr("ipimax")
        addBr("ipimed")
        addBr("desc")
        for (i = 0; i < 2; i++) {
            addBr("mp")
            addBr("id")
        }

        let linha = document.createElement("p")
        linha.textContent = ""
        linha.id = "linha"
        linha.style.marginTop = "50px"
        document.getElementById("desc").appendChild(linha)

        addText("desc", "Total: ", false)
        addText("rstotalmed", "R$ " + totalMedio.toFixed(2), false)
        addText("rstotalmax", "R$ " + totalMaximo.toFixed(2), false)
        addText("ipimed", "R$ " + ipiMedio.toFixed(2), false)
        addText("ipimax", "R$ " + ipiMax.toFixed(2), false)

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

        if (localStorage.getItem("mpSelected") != "" && localStorage.getItem("operations") != "" &&
            localStorage.getItem("pvMin") != "") {

            addText("id", 0, false)
            addText("mp", localStorage.getItem("mpSelected"), true, true, 0)
            addText("desc", localStorage.getItem("opt"))

            addText("rstotalmed", "R$ " + parseFloat(localStorage.getItem("pvMin"))
                .toFixed(2))
            totalMedio += parseFloat(localStorage.getItem("pvMin"))

            let ipiTemp = ((localStorage.getItem("ipi")) / 100 * localStorage.getItem("pvMin"))
            addText("ipimed", "R$ " + parseFloat(ipiTemp).toFixed(2))
            ipiMedio += parseFloat(ipiTemp)

            addText("rstotalmax", "R$ " + parseFloat(localStorage.getItem("pvMax"))
                .toFixed(2))
            totalMaximo += parseFloat(localStorage.getItem("pvMax"))

            ipiTemp = ((localStorage.getItem("ipi")) / 100 * localStorage.getItem("pvMax"))
            addText("ipimax", "R$ " + parseFloat(ipiTemp).toFixed(2))
            ipiMax += parseFloat(ipiTemp)

            orcament.push(perform())
            orcament.push(perform("info"))
            orcament.push(perform("services"))
        }

        if (fs.existsSync(join(__dirname, "..", "..", "temp.json"))) {
            let data = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "temp.json")))
            console.log(data)

            for (i in data) {
                addText("id", parseFloat(i) + 1, false)
                addText("mp", data[i][0], true, true, parseFloat(i) + 1)
                addText("desc", data[i][1])

                // console.log((preco[data[i][0]][1] ? higiPreco : 0))
                let precoM = parseFloat(data[i][3])
                addText("rstotalmed", "R$ " + precoM.toFixed(2))
                totalMedio += precoM

                let ipiTemp = (data[i][8] / 100) * precoM
                addText("ipimed", "R$ " + parseFloat(ipiTemp).toFixed(2))
                ipiMedio += parseFloat(ipiTemp)

                precoM = parseFloat(data[i][4])
                ipiTemp = (data[i][8] / 100) * precoM
                addText("ipimax", "R$ " + parseFloat(ipiTemp).toFixed(2))
                ipiMax += parseFloat(ipiTemp)

                addText("rstotalmax", "R$ " + precoM.toFixed(2))
                totalMaximo += precoM

                orcament.push(data[i][5])
                orcament.push(data[i][6])
                orcament.push(data[i][7])
            }

            // console.log(Array(operations).push("AA"))
        }

        let linha = document.createElement("p")
        linha.textContent = ""
        linha.id = "linha"
        document.getElementById("desc").appendChild(linha)

        // console.log(totalMedio, totalMaximo)
        addBr("rstotalmed")
        addBr("rstotalmax")
        addBr("ipimed")
        addBr("ipimax")
        addBr("desc")
        for (i = 0; i < 2; i++) {
            addBr("id")
            addBr("mp")
        }

        addText("desc", "Total: ", false)

        addText("ipimed", "R$ " + ipiMedio.toFixed(2), false)
        addText("rstotalmed", "R$ " + totalMedio.toFixed(2), false)
        addText("ipimax", "R$ " + ipiMax.toFixed(2), false)
        addText("rstotalmax", "R$ " + totalMaximo.toFixed(2), false)
        if (!fs.existsSync(join(__dirname, "..", "..", "orcamentos.json")))
            await fs.writeFileSync(join(__dirname, "..", "..", "orcamentos.json"),
                JSON.stringify({}))

        let json = await
            JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "orcamentos.json")))
        json[id] = [orcament, data, localStorage.getItem("ipi")]
        await fs.writeFileSync(join(__dirname, "..", "..", "orcamentos.json"), JSON.stringify(json))
        try {
            await fs.unlinkSync(join(__dirname, "..", "..", "temp.json"))
        } catch {  }
    }

}