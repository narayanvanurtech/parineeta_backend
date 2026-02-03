const { Blogs } = require("../config/db");
const Blog = require("../models/Blog");
const fileUpload=require("../services/multer")
const { v4: uuid } = require("uuid");

exports.addBlogs = async (req, res) => {
  try {
    const user = req.user; 

    const { title, category, status, publishDate, content,author } = req.body;

    if (!title || !category || !status || !publishDate || !content || !author) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const imageFiles = req.files?.image || [];

    const imageResults = await Promise.all(
      imageFiles.map(file =>
        fileUpload(file.buffer.toString("base64"), uuid())
      )
    );

    const fullName = user.firstName + " "+ user.lastName

    const newBlog = await Blogs.create({
      title,
      category,
      status,
      publishDate,
      author:author || fullName ,              
      content,
      image: imageResults.map(img => img.url),
    });


    const populatedBlog = await Blogs.findById(newBlog._id)
      .populate("author", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Blog Published Successfully!",
      blog: populatedBlog,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error While Creating Blog",
    });
  }
};

exports.getAllBlogs = async (req,res)=>{
  try {
  const allBlogs =   await Blogs.find()
  if(!allBlogs){
    return res.status(404).json({message:"Failed to get all Blogs",success:false})
  }

  res.status(201).json({message:"Get Blogs successfully !",success:true,blogs:allBlogs})
  } catch (error) {
   res.status(404).json({message:"error while getting blogs",success:false})
    
  }
}

exports.deleteBlogs = async (req,res)=>{
  try {
    const {id}= req.params
    if(!id){
      return res.status(401).json({message:"Failed to get Blog Id",success:false})
    }

    const deleteBlog = await Blog.findByIdAndDelete(id)
    res.status(201).json({message:"Delete Blog Successfully !",success:true,blogs:deleteBlog})
  } catch (error) {
    res.status(404).json({message:"Failed to delete blog",success:false})
  }
}

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, status, publishDate, content } = req.body;

    // 1️⃣ Check blog exists
    const blog = await Blogs.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // 2️⃣ Get old images from frontend
    let oldImages = [];
    if (req.body.oldImages) {
      oldImages = Array.isArray(req.body.oldImages)
        ? req.body.oldImages
        : [req.body.oldImages];
    }

    // 3️⃣ Upload new images if any
    let newImages = [];
    const imageFiles = req.files?.image || [];

    if (imageFiles.length > 0) {
      const imageResults = await Promise.all(
        imageFiles.map((file) =>
          fileUpload(file.buffer.toString("base64"), uuid())
        )
      );
      newImages = imageResults.map((img) => img.url);
    }

    // 4️⃣ Merge old + new images
    const finalImages =
      oldImages.length || newImages.length
        ? [...oldImages, ...newImages]
        : blog.image;

    // 5️⃣ Build update object safely
    const updateData = {
      image: finalImages,
    };

    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (publishDate !== undefined) updateData.publishDate = publishDate;
    if (content !== undefined) updateData.content = content;

    // 6️⃣ Update blog
    const updatedBlog = await Blogs.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      blog: updatedBlog,
    });

  } catch (error) {
    console.error("Update Blog Error:", error);
    res.status(500).json({
      success: false,
      message: "Error while updating blog",
    });
  }
};




