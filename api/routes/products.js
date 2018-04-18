const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb){
        cb(null, new Date().toISOString() + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    // file rejected
    if(file.MimeType === "image/jpg" || file.MimeType === "image/png"){
      cb(null,false);
    } else {
      cb(null,true);
    }
};

const upload = multer({
    storage:storage, 
    limits: {
      fileSize: 1024 * 1024 * 5
},
    fileFilter:fileFilter
});

const Product = require('../models/product');

router.get('/', (req, res, next) => {
    Product.find()
      .select("_id name price productImage")
      .exec()
      .then(docs => {
          const response = {
            count: docs.length,
            products: docs.map(doc => {
                return {
                    _id:doc._id,
                    name:doc.name,
                    price:doc.price,
                    productImage:doc.productImage,
                    request: {
                        type:'GET',
                        url:'http://localhost:3000/products/' + doc._id
                    }
                }
              })
          };
        //   if (docs.lenght >= 0){
            res.status(200).json(response);
        //   } else {
        //  res.status(404).json({
        //         message:"No entries found"
        //     });  
        //   }
      })
      .catch(err => {
          console.log(err);
          res.status(500).json({
              error:err
          });
      })
});

router.post('/', upload.single('productImage'), (req, res, next) => {
    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price,
        productImage: req.file.path
    });
    product
      .save()
      .then(result => {
        console.log(result);
        res.status(201).json({
            message : 'Created product successfully',
            createdProduct: {
                _id:result._id,
                name:result.name,
                price:result.price,
                request:{
                    type:'GET',
                    url:"http://localhost:3000/products/" + result._id
                }
            }
      })
      .catch(err => {
          console.log(err);
          res.status(500).json({
              error : err
          });
        });
    });
});

router.get('/:productId', (req, res, next) => {
    const id = req.params.productId;
    Product.findById(id)
      .select("_id name price productImage")
      .exec()
      .then(doc => {
          console.log("From Database",doc);
          if (doc) {
              res.status(200).json({
                  product: doc,
                  request:{
                      type:"GET",
                      url:"http://localhost:3000/products/" + doc._id
                  }
              });
          } else {
              res.status(404).json({
                  message:"No valid entry found for provied ID"
              })
          }
      })
      .catch(err => {
          console.log(err);
          res.status(500).json({error: err});
      });
});

router.patch('/:productId', (req, res, next) => {
    const id = req.params.productId;
    const updateOps = {};
    for(const ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Product.update({ _id:id }, { $set: updateOps })
      .exec()
      .then(result => {
        res.status(200).json({
          message:"Product update",
          request:{
              type:"GET",
              url:"http://localhost:3000/products/" + id
          }
        });
    })
      .catch(err => {
        console.log(err);
        res.status(400).json({
            error: err
        });
    });
});

router.delete('/:productId', (req, res, next) => {
    const id = req.params.productId
    Product.remove({_id: id})
    .exec()
    .then(result => {
        res.status(200).json({
            message:"Product Deleted",
            request:{
                type:"POST",
                url: "http://localhost:3000/products/",
                body: { name: "String", price: "Number"}
            }
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error:err
        })
    })
});

module.exports = router;
