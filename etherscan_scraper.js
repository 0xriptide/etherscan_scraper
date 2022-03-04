//etherscan_scraper v1 by @0xriptide
//
//Manually save the file from https://etherscan.io/contractsVerified?filter=solc as contracts.html
//Add your etherscan API key. Rate limiting is built into the script.
//Script will read saved html file and extract contract addresses to contract_list.txt
//then pull all contracts and export to individual .sol files
//

var fs = require('fs');
var fs1 = require('fs');

const cheerio = require('cheerio')
const API_KEY = ''; //Your etherscan API key
const contractshtml = 'contracts.html'; //Name of your saved .html you manually downloaded from https://etherscan.io/contractsVerified?filter=solc
const contractAddresses = 'contract_list.txt';

//url format for Etherscan API call: url = 'https://api.etherscan.io/api?module=contract&action=getsourcecode&address=' + contract + '&apikey=' + API_KEY;

//Create a DOM to utilize jQuery
const { JSDOM } = require( "jsdom" );
const { json } = require('stream/consumers');
const { exit, kill } = require('process');
const { window } = new JSDOM( "" );
const $$ = require( "jquery" )( window );

//Filter all .href attributes for cheerio
const isMidi = (i, link) => {
    if (typeof link.attribs.href === 'undefined') { return false }
    return link.attribs.href.includes('#code');
};

if(!API_KEY) { console.log("No API key!"); exit(); }

readingFile(contractshtml, contractAddresses)
    .then(() => { console.log("Read and write file complete. ")});

async function readingFile(contractshtml, contractAddresses) {
    const data = await fs.promises.readFile(contractshtml);
    var contract_list = [];
    var filedata = "";
    const $ = cheerio.load(data, null, false);

    $('a').filter(isMidi).each((i, link) => {
        const href = link.attribs.href;
        filedata += href.substring(41, 83);
        contract_list.push(href.substring(41, 83));
        filedata += "\r\n";
    });

    await fs1.promises.writeFile(contractAddresses, filedata);

    await exportSol(contract_list)
        .then((i) => { console.log("Wrote " + i + " contracts")});
}

async function exportSol(contract_list) {
    var i = 0;
    var a = 0;
    var url = "";

    for (i = 0; i < contract_list.length; i++) {

        url = 'https://api.etherscan.io/api?module=contract&action=getsourcecode&address=' + contract_list[i] + '&apikey=' + API_KEY;

        console.log(url);

        if (a == 5) {
            var waitTill = new Date(new Date().getTime() + 1 * 2000);
            while (waitTill > new Date()) { };
            a = 0;
        }

        a++;

        await $$.getJSON(url, function (data1) {
            if (data1.status == 1) {
                fs.writeFile(contract_list[i] + '.sol', data1.result[0].SourceCode, function (err) {
                    if (err) return console.log(err);
                });
            }
        });
    }

    return i;
}