
const { ipcRenderer } = require('electron');
const fs = require('fs');
const { join } = require('path');
const xlsxFile = require('read-excel-file/node')

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
    let operations = []

    inputs.forEach(i => {
        if (i.checked) operations.push(i.id)
    })

    if (operations.length != 0) {
        localStorage.setItem("operations", operations)
        ipcRenderer.send("report")
    } else ipcRenderer.send("showMsg",
        ["Selecione pelo menos uma operação para gerar o orçamento.", "Info"])
}

window.onload = async () => {
    document.getElementById("back").addEventListener("click", () => ipcRenderer.send("backTo"))
    document.getElementById("help").addEventListener("click", () => ipcRenderer.send("showMsg",
        ["Monte uma planilha com o seguinte formato: \n\nOperação (Coluna A) - Centro de Custo (Coluna B) - Tempo/min (Decimal) (Coluna C)",
            "Info"]))

    if (fs.existsSync(join(__dirname, "..", "..", "operacoes.json"))) {
        document.getElementById("import").style.display = "flex"
        document.getElementById("help").style.display = "flex"

        document.querySelector("div.btn").style.position = "fixed"
        document.querySelector("div.btn").style.bottom = "20px"
        document.querySelector("div.btn").style.left = "25px"
        document.getElementById("help").style.marginLeft = "90px"

        // console.log(join(__dirname, "..", "..", "operacoes.json"))

        let data = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "operacoes.json")))
        // console.log(data)

        let operaList = []
        for (i in data) {
            operaList.push(i)
        }
        operaList.sort()

        for (i in data) {
            let j = Object.keys(data).indexOf(i)
            addText("opera", operaList[j], true)
            addText("cc", data[operaList[j]][0])
            addText("tempMe", data[operaList[j]][4])
            addText("tempMax", data[operaList[j]][5])
            // console.log(i)
        }
    } else {
        let info = document.createElement("p")
        document.querySelector("div.table-responsive").style.display = "none"
        document.getElementById("import").style.display = "flex"
        document.getElementById("import").style.minWidth = "300px"
        document.getElementById("help").style.display = "flex"
        document.getElementById("title").style.display = "flex"
        document.getElementById("title").textContent = "Importe as operações"
        info.textContent = "Nenhuma operação importada"

        document.getElementById("tabela").appendChild(info)
    }

    if (localStorage.getItem("editItem") == 1) {
        let inputs = document.querySelectorAll("input");
        let data = JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "temp.json")))
        data = data[0][5]

        inputs.forEach(i => {
            if (data.includes(i.id)) {
                i.checked = true
            } 
        })
    }
}

function importar() {
    ipcRenderer.send("importar", "opera")
}

ipcRenderer.on("operaData", async (event, arg) => {
    let opera = {}
    await xlsxFile(arg).then((rows) => {
        for (i in rows) {
            if ((rows[i][0] != null && rows[i][1] != null) && !isNaN(rows[i][2])) {
                if (opera[String(rows[i][0]).toUpperCase() + " - " + rows[i][1]] == undefined)
                    opera[String(rows[i][0]).toUpperCase() + " - " + rows[i][1]] = [rows[i][1], 0, 1, 0]

                if (opera[String(rows[i][0]).toUpperCase() + " - " + rows[i][1]] == undefined)
                    opera[String(rows[i][0]).toUpperCase() + " - " + rows[i][1]] = [rows[i][1], 0, 1, 0]

                opera[String(rows[i][0]).toUpperCase() + " - " + rows[i][1]][1] += rows[i][2]
                opera[String(rows[i][0]).toUpperCase() + " - " + rows[i][1]][2] += 1

                if (rows[i][2] > opera[String(rows[i][0]).toUpperCase() + " - " + rows[i][1]][3])
                    opera[String(rows[i][0]).toUpperCase() + " - " + rows[i][1]][3] = rows[i][2]

            }
        }
    })

    for (i in opera) {
        opera[i][1] = opera[i][2] > 1 ? opera[i][1] / opera[i][2] : opera[i][1]
        let h = new Date(0, 0)

        h.setSeconds(+opera[i][1] * 3600)
        opera[i][4] = h.toTimeString().slice(0, 8)

        if (opera[i][4] == "00:00:00") opera[i][4] = "00:00:01"
        if (opera[i][2] == 1) {
            h = new Date(0, 0)

            h.setSeconds(+opera[i][1] * 3600)
            opera[i][4] = h.toTimeString().slice(0, 8)
            // console.log(opera[i][2], i, h.toTimeString().slice(0, 8))
        }

        h = new Date(0, 0)
        h.setSeconds(+opera[i][3] * 3600)
        opera[i][5] = h.toTimeString().slice(0, 8)
    }
    console.log(opera)
    await fs.writeFileSync(join(__dirname, "..", "..", "operacoes.json"), JSON.stringify(opera))
    location.reload()
})

