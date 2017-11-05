const mongoose = require("mongoose");
const Store = mongoose.model("Store");
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");

const multerOpts = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That fileType is not allowed!" }, false);
    }
  }
};

exports.upload = multer(multerOpts).single("photo");

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  const extension = req.file.mimetype.split("/")[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our filesystem, keep going!
  next();
};

exports.homePage = (req, res) => {
  res.render("index");
};

exports.createStore = async (req, res) => {
  const store = await new Store(req.body).save();
  req.flash("success", `Successfully Created ${store.name}.`);
  res.redirect(`/store/${store.slug}`);
};

exports.addStore = (req, res) => {
  res.render("editStore", { title: "Add Store" });
};

exports.getStores = async (req, res) => {
  // 1. Query the database for a list of all stores
  const stores = await Store.find();
  res.render("stores", { title: "Stores", stores });
};

exports.updateStore = async (req, res) => {
  const store = await Store.findByIdAndUpdate(
    { _id: req.params.id },
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).exec();

  req.flash(
    "success",
    `Successfully Updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store →</a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
};

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  res.render("editStore", { title: `Edit ${store.name}`, store });
};

exports.getStore = async (req, res) => {
  const store = await Store.findOne({ slug: req.params.slug });
  if (!store) return next();
  res.render("store", { title: `Edit ${store.name}`, store });
};
