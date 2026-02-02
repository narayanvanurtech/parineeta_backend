const express = require("express")

const router = express.Router()
const zibaController = require("../controllers/zibaController")
const admin = require("../middleware/admin")


//Ziva Customer
router.post("/",zibaController.addZiba)
router.get("/",zibaController.getAllZivacustomer)
router.delete("/:id", admin.adminMiddleware,zibaController.deletZivaCustomer)
router.put("/:id",admin.adminMiddleware,zibaController.updateZivaCustomer)

//Subject 
router.get("/allSubject",zibaController.getAllSubject)
router.post("/addSubject",zibaController.addSubject)
router.delete("/deleteSubject/:id",zibaController.deleteSubject)
router.put("/editSubject/:id",zibaController.editSubject)


module.exports=router