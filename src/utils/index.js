const renameObjKey = (oldObj, oldKey, newKey) => {
  const keys = Object.keys(oldObj)
  const newObj = keys.reduce((acc, val) => {
    if (val === oldKey) {
      acc[newKey] = oldObj[oldKey]
    } else {
      acc[val] = oldObj[val]
    }
    return acc
  }, {})

  return newObj
}

module.exports = {
  renameObjKey,
}
