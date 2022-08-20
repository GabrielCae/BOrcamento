const fs = require('fs')
const { join } = require('path')

let orcament = []

async function addText(id, text, orc = true, classP = "") {
    let p = document.createElement("p")
    p.textContent = text

    if (classP != "") p.className = classP
    else p.className = id

    console.log(localStorage.getItem("onlyView"))
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

window.onload = async () => {
    if (localStorage.getItem("onlyView") == true) {

        let data = await JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "orcamentos.json")))
        let infos = []
        for (i in data) {
            if (i == localStorage.getItem("idToView")) infos = data[i]
        }

        addText("mp", infos[0][0], false)
        addText("desc", infos[0][1], false)
        addText("rsunim", infos[0][2], false)
        addText("rsunima", infos[0][3], false)
        addText("rstotal", infos[0][4], false)

        document.getElementById("data").textContent = infos[1]
        document.getElementById("title").textContent = "Orçamento - "+localStorage.getItem("idToView")
    

    } else {
        if (fs.existsSync(join(__dirname, "..", "..", "orcamentos.json"))) {
            let data = await JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "orcamentos.json")))

            let lastId = 0
            for (i in data) {
                lastId = i
            }
            id = parseInt(lastId) + 1
            document.getElementById("title").textContent = "Orçamento - "+id
        } else document.getElementById("title").textContent = "Orçamento - 0"

        var data = new Date().toLocaleDateString();
        document.getElementById("data").textContent = data

        addText("mp", localStorage.getItem("mpSelected"))
        addText("desc", localStorage.getItem("opt"))
        addText("rsunim", 0)
        addText("rsunima", 0)
        addText("rstotal", 0)

        if (!fs.existsSync(join(__dirname, "..", "..", "orcamentos.json")))
            await fs.writeFileSync(join(__dirname, "..", "..", "orcamentos.json"),
                JSON.stringify({}))

        let json = await
            JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "orcamentos.json")))
        json[id] = [orcament, data]
        await fs.writeFileSync(join(__dirname, "..", "..", "orcamentos.json"), JSON.stringify(json))
    }

}