// ==UserScript==
// @name         Yejitag
// @namespace    https://github.com/yejibros
// @version      1.0.1
// @description  Easily download images from 4chan(nel) with tags for import into Hydrus Network
// @author       yejibros
// @downloadURL  https://github.com/yejibros/yejitag/raw/master/yejitag.user.js
// @updateURL    https://github.com/yejibros/yejitag/raw/master/yejitag.user.js

// @match        *://boards.4chan.org/*
// @match        *://boards.4channel.org/*

// @connect      localhost

// @run-at       document-idle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest

// ==/UserScript==
/* jshint -W097 */
'use strict';

///////

let posX = GM_getValue('left','50px');
let posY = GM_getValue('top','50px');
let savedTags = GM_getValue('savedTags',[]);
let savedTagsIndex = 0;

let bgColor, textareaColor, borderColor, textColor;

function setColors() {
    let replyDiv = document.createElement('div');
    replyDiv.className = 'reply';
    replyDiv.style.display = 'none';
    document.body.appendChild(replyDiv);

    let textarea = document.createElement('input');
    textarea.type = 'text';
    replyDiv.appendChild(textarea);

    let replyBgColor = getComputedStyle(replyDiv).getPropertyValue('background-color');
    let textarea_style = getComputedStyle(textarea);

    bgColor = GM_getValue('bgColor',replyBgColor);
    textareaColor = GM_getValue('textareaColor',textarea_style.backgroundColor);
    borderColor = GM_getValue('borderColor',textarea_style.backgroundColor);
    textColor = GM_getValue('textColor',textarea_style.color);

    replyDiv.parentNode.removeChild(replyDiv);
}

setColors();

let filenameNamespace = GM_getValue('filenameNamespace',false); // "filenameNamespace": "filename"

if (filenameNamespace === false) {
    filenameNamespace = 'filename';
    GM_setValue('filenameNamespace',filenameNamespace);
} else if (filenameNamespace) {
    filenameNamespace += ':';
}

///////

function ge(e) {return document.getElementById(e)}

function addToSavedTags(tags) {
    savedTags.unshift(tags);
    savedTags.length = Math.min(savedTags.length, 10);
    GM_setValue('savedTags',savedTags);
    savedTagsIndex = 0;
}

function recallTags() {
    if (savedTags.length === 0) {return}
    if (savedTagsIndex >= savedTags.length) {savedTagsIndex = 0}
    tagsField.value = savedTags[savedTagsIndex];
    savedTagsIndex += 1;
}

function makeDownloadRequest(imageurl,tags) {
    //console.log(imageurl);
    if (!tags) {
        tags = [];
    }
    //console.log(tags);
    GM_xmlhttpRequest({
        'method':'POST',
        'url':'http://localhost:14007/download?' + imageurl,
        'data':tags, //.join(','),
        'anonymous':true,
        'timeout':12500,
        'onerror':function() { alert('Error downloading to your local server. Is boorutagparser-server running?\nGet it at github.com/JetBoom/boorutagparser-server if you do not have it.'); },
        'onload':function() {console.log(`downloaded ${imageurl} with tags "${tags}"`);clearAllFields();}
    });
}

function clearFields(fields) {
    fields.map((elem) => {(elem.value = '')});
    savedTagsIndex = 0;
}

function clearAllFields() {
    const fields = [imageUrlField,filenameField,namespaceField,nsTagsField]
    if (clearFieldsCheck.checked) {
        fields.push(tagsField);
    }
    clearFields(fields);
}

function addNamespacedTags() {
    const namespace = namespaceField.value;
    let namespacedTags = nsTagsField.value;
    const mainTags = tagsField.value;
    let comma = ''

    if (!namespacedTags) {return}
    const tagsList = namespacedTags.split(/,+/).filter(Boolean);
    if (namespace) {
        namespacedTags = tagsList.map((tag) => (`${namespace}:${tag}`)).join(',');
    }

    clearFields([namespaceField,nsTagsField]);
    if (mainTags && mainTags.slice(-1) !== ',') {comma = ','}
    tagsField.value = `${mainTags}${comma}${namespacedTags},`;
}

function getTags() {
    const filename = filenameField.value;
    let tags = tagsField.value;

    if (tags) {addToSavedTags(tags)}
    if (filename) {
        tags = `${filenameNamespace}${filename},${tags},`;
    }
    return tags;
}

function doDownload() {
    const imgUrl = imageUrlField.value;

    if (!imgUrl) {
        alert ("no image");
        return;
    }

    const tags = getTags();
    makeDownloadRequest(imgUrl,tags);
}

///////

let div_style = `width:auto;background:${bgColor};border-radius:3px;padding:0 10px 4px;border:0;`;
let div_pos = `left:${posX};top:${posY};`;

let textarea_style = `background-color:${textareaColor};color:${textColor};display:block;border:0!important;overflow:hidden;width:100%;resize:none;border-radius:2px;margin:3px auto auto auto;padding:2px 0;`;

let button_style = "border-radius:2px;padding-top:0px;padding-bottom:1px;";
let drag_style = "position:fixed;user-select:none;";

const control = document.createElement("div");
control.id = "yejitag";
control.classList.add('dialog');
control.style = div_style + drag_style + div_pos;
if (document.querySelector(".catalog-mode")) {control.style.display = "none";}
document.body.appendChild(control);

const yejiMove = document.createElement("div");
yejiMove.id = "yejimove";
yejiMove.style = "height:12px;width:100%;cursor:move;";
control.appendChild(yejiMove);

const imageUrlField = document.createElement("textarea");
imageUrlField.id = "imageurlfield";
imageUrlField.tabIndex = 10;
imageUrlField.rows = 1;
imageUrlField.style = textarea_style + "margin-top:0;white-space:nowrap;";
imageUrlField.placeholder = "image url";
control.appendChild(imageUrlField);

const filenameField = document.createElement("textarea");
filenameField.id = "filenamefield"
filenameField.tabIndex = 11;
filenameField.rows = 1;
filenameField.style = textarea_style + "white-space:nowrap;";
filenameField.placeholder = "filename";
control.appendChild(filenameField);

const namespaceDiv = document.createElement("div");
namespaceDiv.style = "display:flex;margin:0 auto;width:100%;";
control.appendChild(namespaceDiv);

const nsSubDiv = document.createElement("div");
nsSubDiv.style = "display:inline-block;";
namespaceDiv.appendChild(nsSubDiv);

const namespaceField = document.createElement("textarea");
namespaceField.id = "namespacefield";
namespaceField.tabIndex = 12;
namespaceField.rows = 1;
namespaceField.style = textarea_style + "width:68px;white-space:nowrap;";
namespaceField.placeholder = "namespace";
nsSubDiv.appendChild(namespaceField);

const addTagsButton = document.createElement("input");
addTagsButton.id = "addnstagsbutton";
addTagsButton.type = "button";
addTagsButton.value = "add tags";
addTagsButton.tabIndex = 14;
addTagsButton.style = button_style + "width:100%;margin-top:3px;";
addTagsButton.onclick = addNamespacedTags;
nsSubDiv.appendChild(addTagsButton);

const nsTagsField = document.createElement("textarea");
nsTagsField.id = "nstagsfield";
nsTagsField.tabIndex = 13;
nsTagsField.rows = 2;
nsTagsField.style = textarea_style + "display:inline-block;margin:3px 0 0 3px;overflow:auto;";
nsTagsField.placeholder = "tags";
namespaceDiv.appendChild(nsTagsField);

const tagsField = document.createElement("textarea");
tagsField.id = "tagsfield";
tagsField.rows = 2;
tagsField.tabIndex = 15;
tagsField.style = textarea_style + "width:280px;min-width:280px;min-height:40px;resize:both;overflow:auto;";
tagsField.placeholder = "tags separated by commas";
control.appendChild(tagsField);

const buttonsDiv = document.createElement("div");
buttonsDiv.style = "margin:auto;display:flex;width:100%";
control.appendChild(buttonsDiv);

const buttonsDiv2 = document.createElement("div");
buttonsDiv2.style = "margin:4px auto;";
buttonsDiv.appendChild(buttonsDiv2);

const clearFieldsCheck = document.createElement("input");
clearFieldsCheck.id = "clearfieldscheck";
clearFieldsCheck.type = "checkbox";
clearFieldsCheck.title = "clear tags";
clearFieldsCheck.checked = true;
clearFieldsCheck.style = button_style + "margin:0 2px auto;";
buttonsDiv2.appendChild(clearFieldsCheck);

const clearButton = document.createElement("input");
clearButton.type = "button";
clearButton.value = "clear";
clearButton.tabIndex = 17;
clearButton.style = button_style + "margin:0 2px auto;";
clearButton.onclick = clearAllFields;
buttonsDiv2.appendChild(clearButton);

const recallButton = document.createElement("input");
recallButton.type = "button";
recallButton.value = "recall";
recallButton.tabIndex = 20;
recallButton.style = button_style + "margin:0 2px auto;";
recallButton.onclick = recallTags;
buttonsDiv2.appendChild(recallButton);

const downloadButton = document.createElement("input");
downloadButton.value = "download with tags";
downloadButton.type = "button";
downloadButton.tabIndex = 16;
downloadButton.style = button_style + "margin:0 2px auto;"
downloadButton.onclick = doDownload;
buttonsDiv2.appendChild(downloadButton);

///////

// The current position of mouse
let x = 0;
let y = 0;

// Query the element
const ele = control; // #yejitag
const movEle = yejiMove; // #yejimove

// Handle the mousedown event
// that's triggered when user drags the element
const mouseDownHandler = function (e) {
    // Get the current mouse position
    x = e.clientX;
    y = e.clientY;

    // Attach the listeners to `document`
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
};

const mouseMoveHandler = function (e) {
    // How far the mouse has been moved
    const dx = e.clientX - x;
    const dy = e.clientY - y;

    // Set the position of element
    ele.style.top = `${ele.offsetTop + dy}px`;
    ele.style.left = `${ele.offsetLeft + dx}px`;

    // Reassign the position of mouse
    x = e.clientX;
    y = e.clientY;
};

const mouseUpHandler = function () {
    // Remove the handlers of `mousemove` and `mouseup`
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    GM_setValue('left', ele.style.left);
    GM_setValue('top', ele.style.top);
};

yejiMove.addEventListener('mousedown', mouseDownHandler);
