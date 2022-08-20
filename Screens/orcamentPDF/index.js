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

window.onload = async () => {
    if (localStorage.getItem("onlyView") == 1) {
        console.log("AAA")
        let data = await JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "orcamentos.json")))
        let infos = []
        for (i in data) {
            if (i == localStorage.getItem("idToView")) infos = data[i]
        }

        for (i = 0; i < infos[0].length; i++) {
            if (isNaN(infos[0][i]) && isUpperCase(infos[0][i])) {
                addText("mp", infos[0][i], false)
                addText("desc", infos[0][i+1], false)
                addText("rstotalmed", parseFloat(infos[0][i+2]).toFixed(2), false)
                addText("rstotalmax", parseFloat(infos[0][i+3]).toFixed(2), false)
            }
        }

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

        addText("mp", localStorage.getItem("mpSelected"))
        addText("desc", localStorage.getItem("opt"))
        addText("rstotalmed", parseFloat(localStorage.getItem("totalMedio"))
        .toFixed(2))
        addText("rstotalmax", parseFloat(localStorage.getItem("totalMaximo"))
        .toFixed(2))

        if (fs.existsSync(join(__dirname, "..", "..", "temp.json"))) {
            let data = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "temp.json")))

            for (i in data) {
                addText("mp", data[i][0])
                addText("desc", data[i][1])
                addText("rstotalmed", parseFloat(data[i][3]).toFixed(2))
                addText("rstotalmax", parseFloat(data[i][4]).toFixed(2))
            }

            // console.log(Array(operations).push("AA"))
        }

        if (!fs.existsSync(join(__dirname, "..", "..", "orcamentos.json")))
            await fs.writeFileSync(join(__dirname, "..", "..", "orcamentos.json"),
                JSON.stringify({}))

        let json = await
            JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "orcamentos.json")))
        json[id] = [orcament, data]
        await fs.writeFileSync(join(__dirname, "..", "..", "orcamentos.json"), JSON.stringify(json))
    }

}