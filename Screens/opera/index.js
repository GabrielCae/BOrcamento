
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
    p.textContent = text
    div.appendChild(p)    

    document.getElementById(id).appendChild(div)
}

function next() {
    let inputs = document.querySelectorAll("input");
    let operations = []

    inputs.forEach(i => {
        if (i.checked) operations.push(i.id)
    })

    localStorage.setItem("operations", operations)
    ipcRenderer.send("report")
}

window.onload = () => {
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

        fs.readFile(join(__dirname, "..", "..", "operacoes.json"), (err, data) => {
            if (err) throw err

            data = JSON.parse(data)
            for (i in data) {
                addText("opera", i, true)
                addText("tempMe", data[i][4])
                addText("tempMax", data[i][5])
            }
        })
    } else {
        let info = document.createElement("p")
        document.getElementById("import").style.display = "flex"
        document.getElementById("help").style.display = "flex"
        document.getElementById("title").style.display = "none"
        info.textContent = "Nenhuma operação importada"

        document.getElementById("tabela").appendChild(info)
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
                if (opera[String(rows[i][0]).toUpperCase()] == undefined)
                    opera[String(rows[i][0]).toUpperCase()] = [rows[i][1], rows[i][2], 0, 0]

                opera[String(rows[i][0]).toUpperCase()][1] += rows[i][2]
                opera[String(rows[i][0]).toUpperCase()][2]++

                if (rows[i][2] > opera[String(rows[i][0]).toUpperCase()][3])
                    opera[String(rows[i][0]).toUpperCase()][3] = rows[i][2]
            }
        }
    })
    // console.log(opera)

    console.log(opera)
    for (i in opera) {
        if (opera[i][2] != 0) {
            opera[i][1] = parseFloat(opera[i][1] / opera[i][2])
            let h = new Date(0, 0)
            h.setSeconds(+opera[i][1] * 3600)
            opera[i][4] = h.toTimeString().slice(0, 8)
        }

        if (opera[i][4] == "00:00:00") opera[i][4] = "00:00:01"

        h = new Date(0, 0)
        h.setSeconds(+opera[i][3] * 3600)
        opera[i][5] = h.toTimeString().slice(0, 8)
    }
    // console.log(opera)
    await fs.writeFileSync(join(__dirname, "..", "..", "operacoes.json"), JSON.stringify(opera))
    location.reload()
})

