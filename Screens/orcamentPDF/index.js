async function addText(id, text, classP = "") {
    let p = document.createElement("p")
    p.textContent = text

    if (classP != "") p.className = classP
    else p.className = id

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


window.onload = () => {
    var data = new Date().toLocaleDateString();
    document.getElementById("data").textContent = data

    addText("mp", localStorage.getItem("mpSelected"))
    addText("desc", localStorage.getItem("opt"))

}