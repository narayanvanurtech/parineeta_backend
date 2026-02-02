const { Subject, Ziba } = require("../models/Ziba");

const addZiba = async (req, res) => {
  try {
    const { fullname, email, subject, message } = req.body;

    console.log(fullname,email,subject,message)

    if (!fullname || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const subjectDoc = await Subject.findById(subject);
    console.log(subjectDoc)
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const zibaCreate = await Ziba.create({
      fullname,
      email,
      subject: subjectDoc._id,
      message,
    });

    
    const ziba = await Ziba.findById(zibaCreate._id).populate(
      "subject",
      "name"
    );

    return res.status(201).json({
      success: true,
      message: "Ziva added successfully",
      data: ziba,
    });
  } catch (error) {
    console.error("Add Ziba Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};




const getAllZivacustomer = async (req, res) => {
  try {
    const allZiba = await Ziba.find({}).populate("subject", "name");

    res.status(200).json({
      success: true,
      message: "Get All Ziva Customers Successfully!",
      ziba: allZiba,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while getting all Ziva customers",
    });
  }
};



const deletZivaCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteZiba = await Ziba.findByIdAndDelete(id);

    if (!deleteZiba) {
      return res.status(404).json({
        success: false,
        message: "Ziva customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ziva Customer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while deleting Ziva customer",
    });
  }
};



const updateZivaCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, subject, message } = req.body;

    const existingZiva = await Ziba.findById(id);
    if (!existingZiva) {
      return res.status(404).json({
        success: false,
        message: "Ziva customer not found",
      });
    }

    // ✅ subject is already an ObjectId from frontend
    const updatedZiva = await Ziba.findByIdAndUpdate(
      id,
      {
        fullname,
        email,
        subject, // <-- store directly
        message,
      },
      { new: true }
    ).populate("subject", "name");

    res.status(200).json({
      success: true,
      message: "Ziva customer updated successfully",
      data: updatedZiva,
    });
  } catch (error) {
    console.error("Update Ziva Error:", error);
    res.status(500).json({
      success: false,
      message: "Error while updating Ziva customer",
    });
  }
};


// subject

const getAllSubject = async (req, res) => {
  try {
    const subjects = await Subject.find({});
    res.status(200).json({
      success: true,
      message: "Get All Subjects Successfully!",
      subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while getting subjects",
    });
  }
};


const addSubject = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name field is required",
      });
    }

    const existSubject = await Subject.findOne({ name })
    if (existSubject) {
      return res.status(409).json({
        success: false,
        message: "Subject already exists",
      });
    }

    const subjectCreate = await Subject.create({ name });



    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject: subjectCreate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while creating subject",
    });
  }
};

const deleteSubject = async (req,res)=>{
   try {
    const { id } = req.params;

    const deleteZiba = await Subject.findByIdAndDelete(id);

    if (!deleteZiba) {
      return res.status(404).json({
        success: false,
        message: "Subject  not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject  deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while deleting Subject ",
    });
  }
}

const editSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validation
    if (!id || !name) {
      return res.status(400).json({
        success: false,
        message: "Subject id and name are required",
      });
    }

    // 🔎 Check duplicate name (exclude current subject)
    const existName = await Subject.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id: { $ne: id },
    });

    if (existName) {
      return res.status(409).json({
        success: false,
        message: "This subject name already exists",
      });
    }

    // 🔍 Check if subject exists
    const existingSubject = await Subject.findById(id);
    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // ✏️ Update
    existingSubject.name = name;
    await existingSubject.save();

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject: existingSubject,
    });
  } catch (error) {
    console.error("Edit Subject Error:", error);
    res.status(500).json({
      success: false,
      message: "Error while updating subject",
    });
  }
};




module.exports = {
  addZiba,
  getAllZivacustomer,
  deletZivaCustomer,
  updateZivaCustomer,
  getAllSubject,
  addSubject,
  deleteSubject,
  editSubject
};
