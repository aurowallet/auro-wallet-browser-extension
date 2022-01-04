var fs = require('fs');

const FILE_NAME = "0.js"
const EDIT_TYPE = {
    "DELETE": "DELETE",
    "ADD": "ADD"
}

let pathCommon = './dist/' + FILE_NAME;
let pathManifest = './dist/manifest.json';
let pathPopup = './dist/popup.html';


fs.readFile(pathCommon, function (err, data) {
    if (err) {
        checkManifest(EDIT_TYPE.DELETE)
        checkPopupHtml(EDIT_TYPE.DELETE)
    } else {
        checkManifest(EDIT_TYPE.ADD)
        checkPopupHtml(EDIT_TYPE.ADD)
    }
})

function checkPopupHtml(editType) {
    fs.readFile(pathPopup, function (err, data) {
        if(err){
            throw new Error("read popup.html failed , please check")
        }else{
            let scriptStr = data.toString();
            let fileIndex = scriptStr.indexOf(FILE_NAME)

            const START_STR = "<script"
            const END_STR = "</script>"
            const INSERT_STR = `<script src="./${FILE_NAME}"></script>\n`
            let scriptStartIndex = scriptStr.indexOf(START_STR)
            if (editType === EDIT_TYPE.ADD && fileIndex === -1) {
                let newStr = scriptStr.slice(0, scriptStartIndex) + INSERT_STR + scriptStr.slice(scriptStartIndex);
                updateFile(pathPopup, newStr)
            } else if (editType === EDIT_TYPE.DELETE && fileIndex !== -1) {
                let scriptEndIndex =  scriptStr.indexOf(END_STR,fileIndex) 
                let targetStr = scriptStr.slice(scriptStartIndex, scriptEndIndex+END_STR.length)
                let newStr = scriptStr.replace(targetStr,"")
                updateFile(pathPopup, newStr)
            }
        }
    })
}
function checkManifest(editType) {
    fs.readFile(pathManifest, function (err, data) {
        if (err) {
            throw new Error("read manifest.json failed , please check")
        } else {
            try {
                let scriptStr = data.toString();
                let scriptJson = JSON.parse(scriptStr)
                let scripts = scriptJson.background.scripts
                let fileIndex = scripts.indexOf(FILE_NAME)

                if (editType === EDIT_TYPE.ADD && fileIndex === -1) { 
                    scriptJson.background.scripts = [...scripts, FILE_NAME]
                    updateFile(pathManifest, JSON.stringify(scriptJson, "", "\t"))
                } else if (editType === EDIT_TYPE.DELETE && fileIndex !== -1) {
                    scripts.splice(fileIndex, 1);
                    scriptJson.background.scripts = scripts
                    updateFile(pathManifest, JSON.stringify(scriptJson, "", "\t"))
                }
            } catch (error) {
                console.log('checkManifest==error', error)
            }
        }
    })
}


function updateFile(path, data) {
    fs.writeFile(path, data, function (err) {
        if (err) {
            console.log(path + "update failed")
        } else {
            console.log(path + "update success");
        }
    })
}