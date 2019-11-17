const scrapeIt = require('scrape-it')
const getSlug = require('speakingurl')
const cloneDeep = require('lodash.clonedeep')
const fs = require('fs')

const urls = require(`${process.cwd()}/data/products/urls.json`)
const productInterface = require(`${process.cwd()}/interfaces/product.json`)

const path = `${process.cwd()}/data/products/list.json`
let scrapedData = []
let currentIdx = 0

function scraping() {
  // Promise interface
  scrapeIt(`${urls[currentIdx]}`, {
    product: {
      selector: '.variations_form.cart',
      data: {
        json: {
          attr: 'data-product_variations',
        },
      },
    },
    jsonLd: {
      selector: 'script[type="application/ld+json"]',
      eq: 1,
      convert: x => JSON.parse(x),
    },
  })
    .then(({ data, response }) => {
      console.log(`[idx]: ${currentIdx}`)
      console.log(`[url]: ${urls[currentIdx]}`)
      console.log(`[code]: ${response.statusCode}`)
      //console.log(data.product && data.product.json)
      if (
        response.statusCode !== 200 ||
        !data.jsonLd ||
        !data.jsonLd['@graph'] ||
        !data.jsonLd['@graph'][1]
        //currentIdx >= 3
      )
        return dumpJsonTofile(scrapedData)
      const jsonData = data.jsonLd['@graph'][1]
      const productItf = cloneDeep(productInterface)
      Object.keys(productItf).forEach(k => {
        if (typeof jsonData[k] !== 'undefined') productItf[k] = jsonData[k]
      })
      Object.keys(productItf.attributes).forEach(k => {
        if (typeof jsonData[k] !== 'undefined')
          productItf.attributes[k] = jsonData[k]
      })
      const slug = getSlug(`${jsonData['name']}-${jsonData['sku']}`, {
        lang: 'es',
      })
      const price =
        jsonData['offers'][0].price || jsonData['offers'][0].highPrice
      const pricePlus = Number(price) + 7.0
      productItf.sku = slug
      productItf.attributes.sku = slug
      productItf.attributes.price = pricePlus
      productItf.attributes.url_key = slug
      productItf.attributes.origin_sku = jsonData['sku']
      productItf.attributes.origin_url = urls[currentIdx]
      console.log(productItf)
      console.log('-'.repeat(80))
      scrapedData.push(productItf)
      currentIdx++
      scraping()
    })
    .catch(error => {
      console.log(error)
    })
}

function dumpJsonTofile(data) {
  console.log('Dumping to file...')
  console.log(data)
  fs.writeFileSync(path, JSON.stringify(data), 'utf8') // write it back
}

console.log('Iniciando scraping de Productos...')

scraping()
