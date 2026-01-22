const authValidation = require('./authValidation');
const productValidation = require('./productValidation');
const addressValidation = require('./addressValidation');
const cartValidation = require('./cartValidation');
const categoryValidation = require('./categoryValidation');
const orderValidation = require('./orderValidation');
const userValidation = require('./userValidation');
const wishlistValidation = require('./wishlistValidation'); // Add this line

module.exports = {
  authValidation,
  productValidation,
  addressValidation,
  cartValidation,
  categoryValidation,
  orderValidation,
  userValidation,
  wishlistValidation // Add this line
};