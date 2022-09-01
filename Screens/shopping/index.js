const { ipcRenderer } = require('electron')
const fs = require('fs')
const { join } = require('path')

async function addText(id, text, orc = true, classP = "") {
    let div = document.createElement("div")
    div.className = "tableDivs"

    // console.log(localStorage.getItem("onlyView"))
    if (orc) {
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
    p.className = id

    div.appendChild(p)

    document.getElementById(id).appendChild(div)
}

async function removeMP(className) {
    let data = await JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "temp.json")))

    data.splice(className, 1)
    await fs.writeFileSync(join(__dirname, "..", "..", "temp.json"), JSON.stringify(data))
    location.reload()
}

async function editMP(className) {
    localStorage.setItem("editItem", 1)
    localStorage.setItem("editId", className)
    ipcRenderer.send("backTo")
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
    document.getElementById("confirm").addEventListener("click", async () => {
        localStorage.setItem("onlyView", 0)
        ipcRenderer.send("closeShop")
        ipcRenderer.send("orcamentPDF")
    })

    let data = await JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "temp.json")))

    if (data.length > 0) {
        let infos = []
        let totalMedio = 0
        let totalMaximo = 0
        let z = 0

        console.log(data)

        for (i = 0; i < data.length; i++) {
            for (j = 0; j < data[i].length; j++) {
                if ((isNaN(data[i][j]) && !String(data[i][j]).startsWith("R$")) &&
                    isUpperCase(data[i][j]) && !Array.isArray(data[i][j])) {
                    // console.log(data[i][j])
                    addText("mp", data[i][j], true, z)
                    z += 1
                    addText("desc", data[i][j + 1], false)
                    addText("rstotalmed", "R$ " + parseFloat(data[i][j + 3]).toFixed(2), false)
                    totalMedio += parseFloat(String(data[i][j + 3]))
                    addText("rstotalmax", "R$ " + parseFloat(data[i][j + 4]).toFixed(2), false)
                    totalMaximo += parseFloat(String(data[i][j + 4]))
                }
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
        document.getElementById("title").textContent = "Orçamento"
    } else {
        fs.unlinkSync(join(__dirname, "..", "..", "temp.json"))

        localStorage.setItem("editItem", 0)
        alert("Todos os itens foram excluídos do orçamento. Esta tela será fechada.")
        ipcRenderer.send("closeShop")

    }
}