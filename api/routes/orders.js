const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Order = require('../models/order');
const Product = require('../models/product');

// Hendle incoming GET requests to /orders
router.get('/', (req, res, next) => {
    Order.find()
    .select("_id product quantity")
    .populate('product','name')
    .exec()
    .then(docs => {
        res.status(200).json({
            count: docs.length,
            orders : docs.map( doc => {
                return{
                    _id:doc._id,
                    product:doc.product,
                    quantity:doc.quantity,
                    request: {
                        type: "GET",
                        url: "http://localhost:3000/orders/" + docs._id
                    }
                }
            })
        })
    })
    .catch(err => {
        res.status(500).json({
            error:err
        })
    })
});
// Hendle incoming POST request to /orders
router.post('/', (req, res, next) => {
    Product.findById(req.body.productId)
    .then(product => {
        if(!product) {
            res.status(404).json({
                message:"Product not found"
            });
        }
        const order = new Order({
            _id: mongoose.Types.ObjectId(),
            quantity: req.body.quantity,
            product: req.body.productId
        });
       return order
        .save()
        .then(result => {
            console.log(result);
            res.status(201).json({
                message:'Order Stored',
                createdOrder:{
                    _id: result._id,
                    product: result.product,
                    quantity: result.quantity
                },
                request: {
                    type:'GET',
                    url: "http://localhost:3000/orders" + result._id
                }
            });
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error:err
        });
    });
});
// Hendling incoming GET request to /orders by id
router.get('/:orderId', ( req, res, next) => {
    Order.findById(req.params.orderId)
      .populate('product')
      .exec()
      .then(order => {
        if (!order) {
            res.status(404).json({
                message:"Order not found"
            })
        }
        res.status(200).json({
            order:order,
            request:{
                type:"GET",
                url:"http://localhost:3000/orders/"
            }
        })
      })
      .catch(err => {
          res.status(500).json({
              error:err
          })
      })
});
// Hendling incoming DELETE request to /delete by id
router.delete('/:orderId', ( req, res, next) => {
    Order.remove({_id: req.params.orderId})
      .exec()
      .then(result => {
          res.status(200).json({
              message:"Order Deleted",
              request:{
                  type:"POST",
                  url: "http://localhost:3000/orders/",
                  body: { productId:"ID", quantity: "Number"}
              }
          });
      })
      .catch(err => {
          res.status(500).json({
            error:err
          })
      })
})

module.exports = router;