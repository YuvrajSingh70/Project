const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

// register a userModel
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const {
    name,
    email,
    password
  } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "This is a sample id",
      url: "profilepicUrl"
    },
  });
  sendToken(user, 201, res);
});

//login user
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const {
    email,
    password
  } = req.body;

  //checkimg if user has given password and email both

  if (!email || !password) {
    return next(new ErrorHander("Please enter email and password", 400));
  }

  const user = await User.findOne({
    email
  }).select("+password");

  if (!user) {
    return next(new ErrorHander("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comaprePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHander("Invalid email or password", 401));
  }
  sendToken(user, 200, res);
});

//logout user
exports.logout = catchAsyncErrors(async (req, res, next) => {

  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
});

// Forgot password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {

  const user = await User.findOne({
    email: req.body.email
  });

  if (!user) {
    return next(new ErrorHander("User not found", 404));
  }

  //Get reset password Token
  const resetToken = user.getResetPassswordToken();
  await user.save({
    validateBeforeSave: false
  });

  const resetPasswordUrl = '${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}'

  const message = ' Your password reset token is: \n\n ${resetPasswordUrl}\n\nIf you have not requested this emial then ignore it';

  try {
    await sendEmail({
      email: user.email,
      subject: 'Ecommerce password Recovery',
    });
    res.status(200).json({
      success: true,
      message: "Email send to user ${user.email} successfully",
    });

  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({
      validateBeforeSave: false
    });

    return next(new ErrorHander(error.message, 500));
  }
});

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {

  //creating token hash
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now()
    },
  });
  if (!user) {
    return next(new ErrorHander("Reset password Token is invaild or has been expired", 400));
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHander("Password does not match", 400));
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  sendToken(user, 200, res);
});

//Get user details
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {

  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});


// Upadte user password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {

  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comaprePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHande("Password does not match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);

});

// Upadte user Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {

  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  }

  // cloudinary

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

//Get all Users --admin
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

//Get single Users --admin
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHander('User does not exit with Id: ${req.parmas.id}'));
  }

  res.status(200).json({
    success: true,
    user,
  });
});


// Upadte user Role
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {

  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});



// Delete user  -- admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHander('User does not exist with Id: ${req.params.id}', 400));
  }

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User deleted successfully"
  });
});

//Create new review or update the review

exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const {
    rating,
    comment,
    productId
  } = req.body;
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const isReviwed = product.reviews.find(rev => rev.user.toString() === req.user._id.toString());


  if (isReviwed) {
product.reviews.forEach(rev=>{
  if(rev.user.toString() === req.user._id.toString())
  (rev.rating=rating), (rev.comment= comment);
});
  } else {
    product.reviews.push(review);
    product.numOfReviews= product.reviews.length
  }
  let avg = 0;
  product.ratings = product.reviews.forEach(rev=>{
    avg= avg+rev.rating
  }) / product.reviews.length;

  await product.save({validateBeforeSave: false});

  res.status(200).json({
    success:true,
  });
});
