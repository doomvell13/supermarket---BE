const formidable = require('formidable')
const _ = require('lodash')
const fs = require('fs')
const Product = require('../models/productModel')
const { errorHandler } = require('../helpers/dbErrorHandler')

exports.productById = (req, res, next, id) => {
  Product.findById(id)
    .populate('category')
    .exec((err, product) => {
      if (err || !product) {
        return res.status(400).json({
          error: 'Product not found',
        })
      }
      req.product = product
      next()
    })
}

exports.read = (req, res) => {
  req.product.photo = undefined
  return res.json(req.product)
}

exports.create = (req, res) => {
  let form = new formidable.IncomingForm()
  form.keepExtensions = true
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Image could not be uploaded',
      })
    }
    // check for all fields
    const { name, description, price, category, stocks, shipping } = fields

    if (!name || !description || !price || !category || !stocks || !shipping) {
      return res.status(400).json({
        error: 'All fields are required',
      })
    }

    let product = new Product(fields)

    if (files.photo) {
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: 'Image should be less than 1mb in size',
        })
      }
      product.photo.data = fs.readFileSync(files.photo.path)
      product.photo.contentType = files.photo.type
    }

    product.save((err, result) => {
      if (err) {
        console.log('PRODUCT CREATE ERROR ', err)
        return res.status(400).json({
          error: errorHandler(err),
        })
      }
      res.json(result)
    })
  })
}

exports.remove = (req, res) => {
  let product = req.product
  product.remove((err, deletedProduct) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      })
    }
    res.json({
      message: 'Delete Product Successful',
    })
  })
}

exports.update = (req, res) => {
  let form = new formidable.IncomingForm()
  form.keepExtensions = true
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Image could not be uploaded',
      })
    }
    // taking product and the updated fields and pass into lodash .extend menthod

    let product = req.product
    product = _.extend(product, fields)

    if (files.photo) {
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: 'Image should be less than 1mb in size',
        })
      }
      product.photo.data = fs.readFileSync(files.photo.path)
      product.photo.contentType = files.photo.type
    }

    product.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        })
      }
      res.json(result)
    })
  })
}
//get all products distinct to product
exports.listCategories = (req, res) => {
  Product.distinct('category', {}, (err, categories) => {
    if (err) {
      return res.status(400).json({
        error: 'Products not found',
      })
    }
    res.json(categories)
  })
}
