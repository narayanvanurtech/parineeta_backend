const Category = require("../models/Category");



const findSubtitleById = (subtitles, id) => {
  for (let subtitle of subtitles) {
    if (subtitle._id.toString() === id) return subtitle;
    if (subtitle.subtitles?.length) {
      const found = findSubtitleById(subtitle.subtitles, id);
      if (found) return found;
    }
  }
  return null;
};

const findParentArrayById = (subtitles, id) => {
  for (let subtitle of subtitles) {
    if (subtitle._id.toString() === id) return subtitle.subtitles;
    if (subtitle.subtitles?.length) {
      const found = findParentArrayById(subtitle.subtitles, id);
      if (found) return found;
    }
  }
  return null;
};




exports.addSubtitle = async (req, res) => {
  try {
    const { categoryId, parentSubtitleId, subtitle } = req.body;

    if (!subtitle?.name) return res.status(400).json({ message: "Subtitle name required" });

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // if parentSubtitleId is not provided, add at root level
    if (!parentSubtitleId) {
      category.subtitles.push({
        name: subtitle.name,
        description: subtitle.description || "",
        subtitles: []
      });
    } else {
      const parentArray = findParentArrayById(category.subtitles, parentSubtitleId);
      if (!parentArray) return res.status(404).json({ message: "Parent subtitle not found" });

      parentArray.push({
        name: subtitle.name,
        description: subtitle.description || "",
        subtitles: []
      });
    }

    await category.save();
    res.status(201).json(category);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




exports.updateSubtitle = async (req, res) => {
  try {
    const { categoryId, subtitleId, name, description } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const target = findSubtitleById(category.subtitles, subtitleId);
    if (!target) return res.status(404).json({ message: "Subtitle not found" });

    if (name !== undefined) target.name = name;
    if (description !== undefined) target.description = description;

    await category.save();
    res.status(200).json(category);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




exports.deleteSubtitle = async (req, res) => {
  try {
    const { categoryId, subtitleId } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const deleteFromArray = (subtitles, id) => {
      for (let i = 0; i < subtitles.length; i++) {
        if (subtitles[i]._id.toString() === id) {
          subtitles.splice(i, 1);
          return true;
        }
        if (subtitles[i].subtitles?.length) {
          const deleted = deleteFromArray(subtitles[i].subtitles, id);
          if (deleted) return true;
        }
      }
      return false;
    };

    const deleted = deleteFromArray(category.subtitles, subtitleId);
    if (!deleted) return res.status(404).json({ message: "Subtitle not found" });

    await category.save();
    res.status(200).json(category);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

