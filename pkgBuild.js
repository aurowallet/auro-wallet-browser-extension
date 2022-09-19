var fs = require('fs');

const FILE_NAME_LIST = ["0.js"]
const EDIT_TYPE = {
    "DELETE": "DELETE",
    "ADD": "ADD"
}


let pathManifest = './dist/manifest.json';
let pathPopup = './dist/popup.html';
let pathNotification = './dist/notification.html';

function fileUpdate(){
    let pathCommon
    for (let index = 0; index < FILE_NAME_LIST.length; index++) {
        const fileName = FILE_NAME_LIST[index];
        pathCommon = './dist/' + fileName;
        fs.readFile(pathCommon, function (err, data) {
            if (err) {
                checkManifest(EDIT_TYPE.DELETE,fileName)
                checkPopupHtml(EDIT_TYPE.DELETE,fileName)
            } else {
                checkManifest(EDIT_TYPE.ADD,fileName)
                checkPopupHtml(EDIT_TYPE.ADD,fileName)
            }
        })
    }
}


function checkPopupHtml(editType,fileName) {
    fs.readFile(pathPopup, function (err, data) {
        if(err){
            throw new Error("read popup.html failed , please check")
        }else{
            let scriptStr = data.toString();
            let fileIndex = scriptStr.indexOf(fileName)

            const START_STR = "<script"
            const END_STR = "</script>"
            const INSERT_STR = `<script src="./${fileName}"></script>\n`
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

    fs.readFile(pathNotification, function (err, data) {
        if(err){
            throw new Error("read notification.html failed , please check")
        }else{
            let scriptStr = data.toString();
            let fileIndex = scriptStr.indexOf(fileName)

            const START_STR = "<script"
            const END_STR = "</script>"
            const INSERT_STR = `<script src="./${fileName}"></script>\n`
            let scriptStartIndex = scriptStr.indexOf(START_STR)
            if (editType === EDIT_TYPE.ADD && fileIndex === -1) {
                let newStr = scriptStr.slice(0, scriptStartIndex) + INSERT_STR + scriptStr.slice(scriptStartIndex);
                updateFile(pathNotification, newStr)
            } else if (editType === EDIT_TYPE.DELETE && fileIndex !== -1) {
                let scriptEndIndex =  scriptStr.indexOf(END_STR,fileIndex) 
                let targetStr = scriptStr.slice(scriptStartIndex, scriptEndIndex+END_STR.length)
                let newStr = scriptStr.replace(targetStr,"")
                updateFile(pathNotification, newStr)
            }
        }
    })
}
function checkManifest(editType,fileName) {
    fs.readFile(pathManifest, function (err, data) {
        if (err) {
            throw new Error("read manifest.json failed , please check")
        } else {
            try {
                let scriptStr = data.toString();
                let scriptJson = JSON.parse(scriptStr)
                let scripts = scriptJson.background.scripts
                let fileIndex = scripts.indexOf(fileName)

                if (editType === EDIT_TYPE.ADD && fileIndex === -1) { 
                    scriptJson.background.scripts = [...scripts, fileName]
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

fileUpdate()