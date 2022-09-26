
const { ipcRenderer } = require('electron');
const fs = require('fs');
const { join } = require('path');

async function addText(id, text, mod = false) {
    let div = document.createElement("div")

    div.className = "tableDivs"

    if (mod) {
        let inp = document.createElement("input")
        inp.type = "checkbox"
        inp.id = text
        div.appendChild(inp)
    }

    let p = document.createElement("p")
    p.className = id
    p.textContent = String(text).split(" - ")[0]
    div.appendChild(p)

    document.getElementById(id).appendChild(div)
}

function next() {
    let inputs = document.querySelectorAll("input");
    let services = []

    inputs.forEach(i => {
        if (i.checked) services.push(i.id)
    })

    localStorage.setItem("services", services)
    ipcRenderer.send("report")
}

window.onload = async () => {
    document.title = "Serviços - " + localStorage.getItem("empresa")

    document.getElementById("termedic").src = localStorage.getItem("empresa") == "EMBAMED" ?
        join(__dirname, "..", "..", "assets", "embamed.png") :
        join(__dirname, "..", "..", "assets", "termedic.png")

    document.getElementById("back").addEventListener("click", () => ipcRenderer.send("operations"))
    document.getElementById("refresh").addEventListener("click", () => location.reload())

    let path = join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
        "servicesEmb.json" : "servicesTerm.json")

    if (fs.existsSync(path)) {
        document.querySelector("div.btn").style.position = "fixed"
        document.querySelector("div.btn").style.bottom = "20px"
        document.querySelector("div.btn").style.left = "25px"

        // console.log(join(__dirname, "..", "..", "operacoes.json"))

        let data = JSON.parse(await fs.readFileSync(path))
        // console.log(data)

        let operaList = []
        for (i in data) {
            operaList.push(i)
        }
        operaList.sort()

        for (i in data) {
            let j = Object.keys(data).indexOf(i)
            addText("opera", operaList[j], true)
            addText("cc", "R$ " + data[operaList[j]])
            // console.log(i)
        }
    } else {
        let info = document.createElement("p")
        document.querySelector("div.table-responsive").style.display = "none"
        document.getElementById("title").style.display = "flex"
        document.getElementById("title").textContent = "Nenhum serviço cadastrado."
        // info.textContent = "Nenhum serviço cadastrado."

        // document.getElementById("tabela").appendChild(info)
    }

    if (localStorage.getItem("editItem") != 0) {
        let inputs = document.querySelectorAll("input");
        console.log(localStorage.getItem("editItem"))

        let path = localStorage.getItem("empresa") == "EMBAMED" ?
            join(__dirname, "..", "..", "orcamentosEmb.json") :
            join(__dirname, "..", "..", "orcamentosTerm.json")

        let data = localStorage.getItem("editItem") == 1 ?
            JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "temp.json"))) :
            JSON.parse(fs.readFileSync(path))


        data = data[localStorage.getItem("editId")][0]
        console.log(data)
        className = parseInt(localStorage.getItem("editName"))

        data = [
            data[className],
            data[className + 1],
            data[className + 2],
            data[className + 3],
            data[className + 4],
            data[className + 5],
            data[className + 6],
            data[className + 7],
            data[className + 8],
        ]
        console.log(data)

        inputs.forEach(i => {
            if (data[localStorage.getItem("editItem") == 1 ? 7 : 8].includes(i.id)) {
                i.checked = true
            }
        })

    }
}