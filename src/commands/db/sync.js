const mysql = require('mysql')
const db = require(`${process.cwd()}/database`).makeDb()
const withTransaction = require(`${process.cwd()}/database`).withTransaction
const products = require(`${process.cwd()}/data/products/list.json`)
const productInterface = require(`${process.cwd()}/interfaces/product.json`)
const cloneDeep = require('lodash.clonedeep')
const renameObjKey = require(`${process.cwd()}/utils`).renameObjKey

const productItfNoAttr = Object.keys(productInterface).filter(
  k => k !== 'attributes'
)

const attributes = {
  sku: { id: 1, field: 'text_value' },
  name: { id: 2, field: 'text_value' },
  url_key: { id: 3, field: 'text_value' },
  new: { id: 5, field: 'boolean_value' },
  featured: { id: 6, field: 'boolean_value' },
  visible_individually: { id: 7, field: 'boolean_value' },
  status: { id: 8, field: 'boolean_value' },
  description: { id: 10, field: 'text_value' },
  price: { id: 11, field: 'float_value' },
  special_price: { id: 13, field: 'float_value' },
  meta_title: { id: 16, field: 'text_value' },
  meta_keywords: { id: 17, field: 'text_value' },
  meta_description: { id: 18, field: 'text_value' },
  origin_sku: { id: 26, field: 'text_value' },
  origin_url: { id: 27, field: 'text_value' },
}

//const categories = [1, 2]

const productsSql = {
  query: `INSERT INTO products (${productItfNoAttr.join()}) VALUES ?`,
  values: cloneDeep(products).map(p => {
    return Object.keys(p)
      .filter(k => {
        if (k !== 'attributes') return true
        return false
      })
      .map(j => p[j])
  }),
}

const insertedProdsIds = {
  query: `SELECT id, sku FROM products\
  WHERE sku IN (${products.map(p => `"${p.sku}"`).join(', ')})`,
}

const product_attribute_valueSql = products.map(p => {
  return (
    Object.keys(p.attributes)
      //.filter(a => a !== 'meta_description')
      .map(k => {
        return {
          query: `INSERT INTO product_attribute_values (channel, locale, attribute_id, ${
            attributes[k].field
          }, product_id) VALUES ('default', 'es', ?,?,(SELECT id FROM products WHERE sku IN (?)))`,
          values: [attributes[k].id, p.attributes[k], p.attributes['sku']],
        }
      })
  )
})

const product_flatSql = products.map(p => {
  if (p.attributes.visible_individualy) {
    p.attributes = renameObjKey(
      p.attributes,
      'visible_individualy',
      'visible_individually'
    )
  }
  return {
    query: `INSERT INTO product_flat\
              (product_id, locale, channel, ${Object.keys(p.attributes)})\
              VALUES ((SELECT id FROM products WHERE\
              sku = ${mysql.escape(p.sku)}), 'es', 'default', ${mysql.escape(
      Object.values(p.attributes)
    )})`,
    values: Object.values(p.attributes),
  }
})

//console.log(product_flatSql)
//process.exit()

const product_inventoriesSql = {
  query: `INSERT INTO product_inventories (product_id, inventory_source_id, qty)\
  SELECT id as product_id, 1 as inventory_source_id, 10 as qty FROM products\
  WHERE sku IN (${products.map(p => `"${p.sku}"`).join(', ')})`,
}

const product_categoriesSql = {
  query: `INSERT INTO product_categories (product_id, category_id)\
          SELECT id as product_id, 1 as category_id  FROM products\
          WHERE sku IN (${products.map(p => `"${p.sku}"`).join(', ')})`,
}

const product_categories2Sql = {
  query: `INSERT INTO product_categories (product_id, category_id)\
          SELECT id as product_id, 2 as category_id  FROM products\
          WHERE sku IN (${products.map(p => `"${p.sku}"`).join(', ')})`,
}

//console.log(product_categoriesSql)
withTransaction(db, async function() {
  console.log('[syncing]: products...')
  await db.query(productsSql.query, [productsSql.values])

  const results = await db.query(insertedProdsIds.query)

  products.forEach(p => {
    results.forEach(r => {
      if (r.sku === p.sku) p.id = r.id
    })
  })
  console.log('[synced]: products.')

  console.log('[syncing]: products flat...')
  product_flatSql.forEach(sql => {
    db.query(sql.query).catch(error => {
      console.log(error)
      console.log(db.lastQuery())
      process.exit()
    })
  })
  console.log('[synced]: products flat.')

  console.log('[syncing]: products attributes...')
  product_attribute_valueSql.forEach(sql => {
    sql.forEach(attr => {
      db.query(mysql.format(attr.query, attr.values)).catch(error => {
        console.log(error)
        console.log(db.lastQuery())
        process.exit()
      })
    })
  })
  console.log('[synced]: products attributes.')

  console.log('[syncing]: products inventories...')
  await db.query(product_inventoriesSql.query)
  console.log('[synced]: products inventories.')

  console.log('[syncing]: product categories...')
  await db.query(mysql.format(product_categoriesSql.query))
  await db.query(mysql.format(product_categories2Sql.query))
  console.log('[synced]: product categories.')

  console.log('[success]: All tables synced correctly.')
})
