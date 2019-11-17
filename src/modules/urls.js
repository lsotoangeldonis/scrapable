const scrapeIt = require('scrape-it')
const fs = require('fs')

const url = 'https://www.playlanmym.com/tienda/page'
const path = './src/data/products/urls.json'
let scrapedData = []
let page = 1

function scraping() {
  // Promise interface
  scrapeIt(`${url}/${page}`, {
    urls: {
      listItem: '.woocommerce-loop-product__link',
      data: {
        link: {
          attr: 'href',
        },
      },
    },
  }).then(({ data, response }) => {
    console.log(`[url]: ${url}/${page}`)
    console.log(`[code]: ${response.statusCode}`)
    console.log(data.urls.map(d => d.link))
    if (response.statusCode !== 200) return dumpJsonTofile(scrapedData)
    scrapedData = scrapedData.concat(data.urls.map(i => i.link))
    page++
    scraping()
  })
}

function dumpJsonTofile(data) {
  console.log('Dumping to file')
  console.log(data)
  fs.writeFileSync(path, JSON.stringify(data), 'utf8') // write it back
}

scraping()
