const axios = require('axios');
const cheerio = require('cheerio');
const ChartJSImage = require('chart.js-image');
const url = process.argv[2];
// console.log(url);

fetchData(url).then((res) => {
    // console.log(res);
    const html = res.data;
    const $ = cheerio.load(html);
    const statsTable = $('table:first > tbody > tr');
    let numberIndex = -1;
    let numberData = [];
    let lableIxdex = -1;
    let lableData = [];
    let corectflag = true;
    let noneDateLableIndex = 0; // this column use for lable when cannot detecting date column
    let noneDateLableData = [];
    statsTable.each(function (e) {
        let title = $(this).find('td');
        for (let i = 0; i < title.length; i++) {
            const pureText = getElementText(title[i]);
            // console.log(pureText);
            let date = Date.parse(pureText); //detect date value
            let test = parseFloat(pureText); // detect number value
            if (lableIxdex == -1) {
                if (date && date < 64086391284000) {
                    lableIxdex = i;
                    // console.log("here", pureText, date);
                    lableData.push(pureText);
                    if (i == noneDateLableIndex && i + 1 < title.length) {
                        noneDateLableIndex++;
                    }
                }
            } else {
                if (date && lableIxdex == i) {
                    lableData.push(pureText);
                }
                if (date && lableIxdex != i) {
                    console.log(i);
                    corectflag = false;
                    console.log(pureText)
                }
            }

            if (numberIndex == -1) {
                if (test && i != lableIxdex) {
                    numberIndex = i;
                    numberData.push(test);
                    if (i == noneDateLableIndex && i + 1 < title.length) {
                        noneDateLableIndex++;
                    }
                }
            } else {
                if (test && numberIndex == i) {
                    numberIndex = i;
                    numberData.push(test);
                }
                if (test && numberIndex != i && lableIxdex != i) { // data is not from chose number column before, also not date column
                    corectflag = false;
                    console.log(pureText)
                }
            }
            if (noneDateLableIndex == -1) {
                if (i != numberIndex && i != lableIxdex) {
                    noneDateLableIndex = i;
                    noneDateLableData.push(pureText);
                }
            } else {
                if (i == noneDateLableIndex) {
                    noneDateLableData.push(pureText);
                }
            }

        }

    });
    // console.log(lableIxdex);
    // console.log(lableData);
    if (corectflag) {
        const line_chart = ChartJSImage().chart({
            "type": "bar",
            "data": {
                "labels": lableIxdex > -1 ? lableData : noneDateLableData,
                "datasets": [
                    {
                        "label": "My First dataset",
                        "backgroundColor": "rgba(54,162,235,0.5)", "borderColor": "rgb(54,162,235)", "borderWidth": 1,
                        "data": numberData
                    }]
            }
        }).backgroundColor('white')
            .width(1028)
            .height(768);
        const filename = 'chart' + Date.now().toString() + '.png';
        console.log("Exporting to", filename)
        line_chart.toFile(filename);
    } else {
        console.log("Cannot correct data");
    }
})

function getElementText(element) {
    let text = "";
    if (element) {
        for (let i = 0; i < element.children.length; i++) {
            if (element.children[i].data) {
                text += element.children[i].data;

            } else {
                if (element.children[i].children[0]?.data) {
                    text += element.children[i].children[0]?.data;
                }
            }
        }
    }
    return text;
}

async function fetchData(url) {
    console.log("Crawling data...")
    // make http call to url
    let response = await axios(url).catch((err) => console.log(err));

    if (response.status !== 200) {
        console.log("Error occurred while fetching data");
        return;
    }
    return response;
}