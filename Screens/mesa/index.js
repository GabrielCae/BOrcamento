const { ipcRenderer } = require("electron")
const fs = require("fs")
const { join } = require("path")

let mp
let name

window.onload = async () => {
    localStorage.setItem("qtde", null)
    document.getElementById("back").addEventListener("click", () => ipcRenderer.send("back"))
    document.getElementById("options").style.display = "none"
    document.getElementById("bob").style.display = "none"
    document.getElementById("esp").style.display = "none"
    document.getElementById("l1").style.display = "none"
    document.getElementById("l2").style.display = "none"
    document.getElementById("cav").style.display = "none"
    document.getElementById("higie").style.display = "none"
    document.getElementById("info").textContent = ""
    document.getElementById("rmv").addEventListener("click", () => removeMP())

    try {
        const rows = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
            "mpEmb.json" : "mpTerm.json")))

        for (i in rows) {
            let opt = document.createElement("option")
            opt.textContent = i
            document.getElementById("materials").appendChild(opt)
        }
    } catch { }

    if (localStorage.getItem("editItem") != 0) {
        let data = []

        if (localStorage.getItem("editItem") == 1) {
            data = JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "temp.json")))
            data = data[localStorage.getItem("editId")]
        } else {
            data = JSON.parse(fs.readFileSync(join(__dirname, "..", "..", "orcamentos.json")))
            data = data[localStorage.getItem("editId")]

            newData = [data[0], data[1], data[2]]
            className = localStorage.getItem("onlyView") == 1 ?
                parseFloat(localStorage.getItem("editName")) :
                0 + (parseFloat(localStorage.getItem("editName")) - 1) * 8
            // console.log(className, data, parseFloat(localStorage.getItem("editName")))

            localStorage.setItem("mpp", className)

            data = [
                data[0][className],
                data[0][className + 1],
                data[0][className + 2],
                data[0][className + 3],
                data[0][className + 4],
                data[0][className + 5],
                data[0][className + 6],
                data[0][className + 7],
            ]
        }
        console.log(data)

        let select = document.getElementById("materials")
        let options = [...select.options]
        let i = 0
        options.forEach((option) => {
            if (option.value == data[0]) {
                select.selectedIndex = i
                showOpts()
            }
            i++
        })

        select = document.getElementById("options")
        options = [...select.options]
        i = 0
        options.forEach((option) => {
            if (option.value == data[1]) select.selectedIndex = i
            i++
        })
        name = data[1]

        adjustInputs()
        let inputs = document.querySelectorAll("input");
        let values = []
        for (j in data[localStorage.getItem("editItem") == 1 ? 6 : 7]) {
            values.push(data[localStorage.getItem("editItem") == 1 ? 6 : 7][j])
        }
        // console.log(values)

        if (localStorage.getItem("editItem") == 2)
            await fs.writeFileSync(join(__dirname, "..", "..", "temp.json"), JSON.stringify(data))

        i = 0
        inputs.forEach(input => {
            if (input.style.display != "none") {
                if (values[i] == "true") document.getElementById("hii").checked = true
                else input.value = values[i]
                i++
            }
        })
    }
    let infos = []
    document.getElementById("right").addEventListener("click", async () => {
        let select = document.getElementById('materials');
        let selectValue = select.options[select.selectedIndex].textContent;

        let selectO = document.getElementById('options');
        let selectValueO = selectO.options[selectO.selectedIndex].textContent;
        if (selectValue != "" && selectValueO != "") {
            let inputs = document.querySelectorAll("input");
            let show = false
            inputs.forEach(i => {
                if (i.style.display != "none" && i.id != "hii") {
                    if (i.value != 0 && i.value != "") {
                        show = true
                        if (i.id == "hii") infos.push(i.checked)
                        else infos.push(i.value)
                    }
                    else show = false
                }
            })
            if (show) {
                localStorage.setItem("higie", document.getElementById("hii").checked)

                localStorage.setItem("mpSelected", mp)
                localStorage.setItem("opt", name)
                localStorage.setItem("infos", infos)
                ipcRenderer.send("operations")
            } else error("Preencha todas as informações!")

        } else error("Preencha todas as informações!")
    })

    setInterval(() => {
        let inputs = document.querySelectorAll("input");
        let show = false
        inputs.forEach(i => {
            if (i.style.display != "none" && i.id != "hii") {
                if (i.value != 0 && i.value != "") {
                    show = true
                }
                else show = false
            }
        })
        if (show) calc()
        else
            document.getElementById("info").textContent = ""
    }, 1000);
}

function error(text) {
    ipcRenderer.send("showError", ["Alerta", text])
}

async function calc() {
    let l1 = document.getElementById("l1").value
    let l2 = document.getElementById("l2").value
    let esp = document.getElementById("esp").value
    let bob = document.getElementById("bob").value
    let cav = document.getElementById("cav").value
    let select = document.getElementById('materials');
    let selectValue = select.options[select.selectedIndex].textContent;

    mp = String(selectValue).toUpperCase()

    if (mp.startsWith("PET")) {
        // console.log(bob, esp, l2, cav)
        try {
            let massa = parseFloat((bob * esp) * (parseFloat(l2) + 20) * ((0.00000137 * 0.13) + 0.00000137)).toFixed(4)
            let totalPC = parseFloat(massa / cav).toFixed(4)

            if (!isNaN(totalPC))
                document.getElementById("info").textContent = "Peso (kg): " + massa + " - Total p/ Pç: " + totalPC

            json = await fs.existsSync(join(__dirname, "..", "..", "config.json")) ?
                await JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "config.json"))) :
                {}

            localStorage.setItem("qtde", totalPC)
            json["conj"] = 1
            await fs.writeFileSync(join(__dirname, "..", "..", "config.json"), JSON.stringify(json))

            localStorage.setItem("info", [massa, totalPC])
        } catch { }

        // console.log(massa, totalPC)
    } else if (mp.startsWith("EVA")) {
        try {
            let area = parseFloat(l1 * l2 * esp)
            let kgPadrao = 356400
            let kgPadraoDec = 0.048
            let kgPC = parseFloat(area * (kgPadraoDec / kgPadrao))
            let percakg = parseFloat(kgPC * 0.2)
            let totalPC = parseFloat(kgPC + percakg).toFixed(4)

            json = await fs.existsSync(join(__dirname, "..", "..", "config.json")) ?
                await JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "config.json"))) :
                {}

            localStorage.setItem("qtde", totalPC)
            json["conj"] = 1
            await fs.writeFileSync(join(__dirname, "..", "..", "config.json"), JSON.stringify(json))

            if (!isNaN(totalPC))
                document.getElementById("info").textContent = "Peso (kg): " + kgPC.toFixed(4) + " - Total p/ Pç: " + totalPC
            localStorage.setItem("info", [kgPC, totalPC])
        } catch (err) { console.log(err) }
        // console.log(kgPC, percakg, totalPC)
    } else if (mp.startsWith("PAPEL")) {
        try {
            let area = l1 * l2
            let areaTotal = (area * 0.1) + area
            let pesoFolha = 0.022
            let medidaFolha = 445 * 635
            let totalPC = parseFloat((areaTotal * pesoFolha) / medidaFolha).toFixed(4)

            json = await fs.existsSync(join(__dirname, "..", "..", "config.json")) ?
                await JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "config.json"))) :
                {}

            localStorage.setItem("qtde", totalPC)
            json["conj"] = 1
            await fs.writeFileSync(join(__dirname, "..", "..", "config.json"), JSON.stringify(json))

            if (!isNaN(totalPC))
                document.getElementById("info").textContent = "Área Total: " + areaTotal + " - Total p/ Pç: " + totalPC
            localStorage.setItem("info", [areaTotal, totalPC])
        } catch { }

        // console.log(parseFloat(totalPC).toFixed(4), medidaFolha)
    }

}

async function removeMP() {
    let select = document.getElementById('materials');
    let value = select.options[select.selectedIndex].textContent;
    let json = JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
        "mpEmb.json" : "mpTerm.json")))
    let a = {}
    if (value != "") {
        for (i in json) {
            if (i === value) delete json[i]
        }
        json = JSON.stringify(json)
        await fs.writeFileSync(join(__dirname, "..", "..", localStorage.getItem("empresa") == "EMBAMED" ?
            "mpEmb.json" : "mpTerm.json"), json)
        location.reload()
    }
}

function isUpperCase(str) {
    return String(str) === String(str).toUpperCase();
}

function addOptions() {
    document.getElementById("info").textContent = ""
    document.getElementById("termedic").style.marginLeft = "90px"
    document.getElementById("bob").style.display = "none"
    document.getElementById("esp").style.display = "none"
    document.getElementById("l1").style.display = "none"
    document.getElementById("l2").style.display = "none"
    document.getElementById("cav").style.display = "none"
    document.getElementById("higie").style.display = "none"
    let rows = []

    if (document.getElementById("options")[1] != undefined) {
        while (document.getElementById("options").childElementCount != 1)
            document.getElementById("options").lastElementChild.remove()
    }

    if (String(mp).startsWith("PET")) rows = ["Blister Externo", "Blister Interno", "Berço"]
    else if (String(mp).startsWith("EVA")) rows = ["Berço", "Tampa", "Suporte"]
    else if (String(mp).startsWith("PAPEL")) rows = ["Externo", "Interno"]

    if (rows.length == 0) document.getElementById("options").style.display = "none"
    else {
        for (i in rows) {
            let opt = document.createElement("option")
            opt.textContent = rows[i]
            document.getElementById("options").appendChild(opt)
        }
    }

}

function adjustInputs() {
    document.getElementById("termedic").style.marginLeft = "280px"
    document.getElementById("bob").style.display = "flex"
    document.getElementById("esp").style.display = "flex"
    document.getElementById("l1").style.display = "flex"
    document.getElementById("l2").style.display = "flex"
    document.getElementById("cav").style.display = "flex"
    document.getElementById("bob").value = null
    document.getElementById("esp").value = null
    document.getElementById("l1").value = null
    document.getElementById("l2").value = null
    document.getElementById("cav").value = null

    if (String(mp).startsWith("PET")) {
        document.getElementById("l1").value = 420
        document.getElementsByName('l1')[0].placeholder = 'Lado 1 em mm'
        document.getElementsByName('l2')[0].placeholder = 'Lado 2 em mm'
        document.getElementById("higie").style.marginTop = "-20px"
        document.getElementById("higie").style.marginBottom = "-24px"
    } else if (String(mp).startsWith("EVA")) {
        document.getElementById("cav").style.display = "none"
        document.getElementById("bob").style.display = "none"
        document.getElementsByName('l1')[0].placeholder = 'Largura'
        document.getElementsByName('l2')[0].placeholder = 'Comprimento'
    } else if (String(mp).startsWith("PAPEL")) {
        document.getElementById("bob").style.display = "none"
        document.getElementById("esp").style.display = "none"
        document.getElementById("cav").style.display = "none"
        document.getElementsByName('l1')[0].placeholder = 'Largura'
        document.getElementsByName('l2')[0].placeholder = 'Comprimento'
    }

    document.getElementById("higie").style.display = "block"

}

async function showOpts() {
    let select = document.getElementById('materials');
    let selectValue = select.options[select.selectedIndex].textContent;

    let selectOpt = document.getElementById('options');
    let selectOptValue = selectOpt.options[selectOpt.selectedIndex].textContent;

    if (selectValue != "") {
        document.getElementById("options").style.display = "grid"
        mp = String(selectValue).toUpperCase()
        document.getElementById("options").addEventListener("change", e => {
            adjustInputs()
            name = e.target.value
            // console.log(selectOptValue.textContent)    
        })
        await addOptions()
    } else document.getElementById("options").style.display = "none"
}

function modify (e) {
    ipcRenderer.send("importInfo")
    localStorage.setItem("whatDo", e)
}