const { ipcRenderer } = require("electron");
const fs = require("fs");
const { join } = require("path");

document.addEventListener('keydown', function (event) {
    if (event.keyCode !== 13) return;
    modify()
})

async function modify() {
    let a = document.getElementById("newValue").value

    if (a != 0) {
        let json = {}
        if (fs.existsSync(join(__dirname, "..", "..", "config.json"))) {
            json = await JSON.parse(await fs.readFileSync(join(__dirname, "..", "..", "config.json")))
        }
        console.log(localStorage.getItem("modify"))
        json[localStorage.getItem("modify")] = a
        await fs.writeFileSync(join(__dirname, "..", "..", "config.json"), JSON.stringify(json))
        ipcRenderer.send("close")
    }
}