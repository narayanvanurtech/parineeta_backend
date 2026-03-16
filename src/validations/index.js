const authValidation = require('./authValidation');
const productValidation = require('./productValidation');
const addressValidation = require('./addressValidation');
const cartValidation = require('./cartValidation');
const categoryValidation = require('./categoryValidation');
const orderValidation = require('./orderValidation');
const userValidation = require('./userValidation');
const wishlistValidation = require('./wishListValidation'); 
const { zibaValidation } = require('./zibaValidation');
const  blogValidation = require("./blogValidation")

module.exports = {
  authValidation,
  productValidation,
  addressValidation,
  cartValidation,
  categoryValidation,
  orderValidation,
  userValidation,
  blogValidation,
  wishlistValidation ,
  zibaValidation
};