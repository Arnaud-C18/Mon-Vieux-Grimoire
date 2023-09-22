const multer = require("multer")
const SharpMulter = require("sharp-multer");

const newFilenameFunction = (filename, options) => {
  const newname =
    `${Date.now()}` + "." + options.fileFormat;
  return newname;
};

const storage = SharpMulter({
  destination: (req, file, callback) => callback(null, "images"),

  imageOptions: {
    fileFormat: "webp",
    resize: { width: 463, height: 595, resizeMode: "cover" },
  },
  
  filename: newFilenameFunction,
});

module.exports = multer({storage: storage}).single('image');
