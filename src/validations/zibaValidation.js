const Joi = require("joi");


const objectId = Joi.string().hex().length(24);


const createZibaValidation = Joi.object({
  fullname: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 3 characters",
      "string.max": "Full name must be less than 50 characters",
    }),

  email: Joi.string()
    .email()
    .trim()
    .required()
    .messages({
      "string.email": "Please provide a valid email",
      "string.empty": "Email is required",
    }),

  subject: objectId
    .required()
    .messages({
      "string.length": "Invalid subject ID",
      "string.hex": "Invalid subject ID format",
      "any.required": "Subject is required",
    }),
});


const updateZibaValidation = Joi.object({
  fullname: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .optional(),

  email: Joi.string()
    .email()
    .trim()
    .optional(),

  subject: objectId.optional(),
}).min(1); 


const zibaIdValidation = Joi.object({
  id: objectId
    .required()
    .messages({
      "string.length": "Invalid Ziba ID",
      "string.hex": "Invalid Ziba ID format",
    }),
});


const zibaQueryValidation = Joi.object({
  subject: objectId.optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});


module.exports = {
  createZibaValidation,
  updateZibaValidation,
  zibaIdValidation,
  zibaQueryValidation,
};
