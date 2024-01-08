const puppeteer = require("puppeteer");
const pdf = require("pdfkit")
const fs = require("fs");

const Playlist = "https://www.youtube.com/playlist?list=PLRBp0Fe2GpglTnOLbhyrHAVaWsCIEX53Y";

let cTab;

(async function () {

    try {

        let browserOpen = puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized"]
        })

        let browserinstance = await browserOpen;
        let allTabsArr = await browserinstance.pages();
        cTab = allTabsArr[0];
        await cTab.goto(Playlist);
        let name = await cTab.evaluate(function (select) { return document.querySelector(select).innerHTML }, 'div[id="container"] yt-formatted-string[disable-attributed-string]');

        let allData = await cTab.evaluate(getdata, ".metadata-stats.style-scope.ytd-playlist-byline-renderer");

        console.log(`Name of the playlist ${name}, further details ${allData.noOfVideos_views}`);

        // let alldata = await cTab.evaluate(function (select) { return document.querySelector(select).innerText }, '.metadata-stats.style-scope.ytd-playlist-byline-renderer');
        // let datatoget = alldata.split(" ")
        // let NoOfViewsPlaylist = datatoget[2];
        // let NoOfVideosPlaylist = datatoget[0];
        // console.log(`Name of the playlist ${name}, No. of Videos ${NoOfVideosPlaylist}, and No. of views ${NoOfViewsPlaylist}`);

        let Totalvideos = allData.noOfVideos_views.split(" ")[0]
        // console.log(Totalvideos);

        let currentVideos = await getCVidoesLength();
        // console.log(currentVideos);

        while (Totalvideos - currentVideos >= 20) {
            await scrolltobottom();
            currentVideos = await getCVidoesLength();
        }

        let finallist = await getstats();
        // console.log(finallist);
        let pdfDoc = new pdf;
        pdfDoc.pipe(fs.createWriteStream("playlist.pdf"));
        pdfDoc.text(JSON.stringify(finallist));
        pdfDoc.end();
        cTab.close();
    } catch (error) {

        console.log(error);

    }

})()

function getdata(selector) {
    let allElements = document.querySelectorAll(selector);
    let noOfVideos_views = allElements[0].innerText;
    // let noOfViews = allElements[1].innerText;

    return {
        noOfVideos_views
    }
}

async function getCVidoesLength() {
    let length = await cTab.evaluate(getlength, '.playlist-drag-handle.style-scope.ytd-playlist-video-renderer')
    return length;
}

async function scrolltobottom(params) {
    await cTab.evaluate(gotobottom);
    function gotobottom() {
        window.scrollBy(0, window.innerHeight)
    }
}

async function getstats() {
    let list = await cTab.evaluate(getNameAndDuration, 'a[id="video-title"]', 'div[id="time-status"]');
    return list;
}
function getlength(durationselect) {
    let durationElem = document.querySelectorAll(durationselect);
    return durationElem.length
}

function getNameAndDuration(videoSelector, durationSelector) {
    let viddeoElem = document.querySelectorAll(videoSelector);
    let durationElem = document.querySelectorAll(durationSelector);

    let currentList = [];
    for (let i = 0; i < durationElem.length; i++){
        let videoTitle = viddeoElem[i].innerText;
        let duration = durationElem[i].innerText;
        currentList.push({ videoTitle, duration });
    }
    return currentList;
}