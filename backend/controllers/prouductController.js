const Product = require("../models/productModel");
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");



//creating product -- admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {

  req.body.user = req.user.id;
  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    product
  });
});

// Get all Product
exports.getAllProducts = catchAsyncErrors(async (req, res) => {

  const resultPerPage = 5; // no of product in a single page
  const productCount = await Product.countDocument;



  const apiApiFeature = new ApiFeatures(Product.find(), req.query)
  .search().
  filter()
  .pagination(resultPerPage);
  const products = await apiApiFeature.query;
  res.status(200).json({
    success: true,
    products
  });
});


//get Product details (single product details)
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
    productCount,
  });
});




//upadte product -- admin

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false
  });

  res.status(200).json({
    success: true,
    product
  });
});

// Delete products

exports.deleteProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }


  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully"
  })

}
