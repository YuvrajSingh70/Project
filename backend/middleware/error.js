const ErrorHandler = require("../utils/errorhander");


module.exports = (err,req,res,next)=>{
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "internal Server Error";


//Wrong mongodb id error

if(err.name === "CasteError"){
  const message="Resource not found. Invalid: ${err.path}";
  err = new ErrorHandler(message,400);
}

//Mongoose duplicate key error
if(err.code === 11000){
  const message = 'Duplicate ${Object.keys(err.keyValue)} Entered';
err = new ErrorHandler(message,400);
}
//Wrong JWT error
if(err.name === "JsonWebTokenError"){
  const message="Json Web Token is Invalid, try again";
  err = new ErrorHandler(message,400);
}

//JWT EXPIRE error
if(err.name === "JsonWebExpireError"){
  const message="Json Web Token is Expired, try again";
  err = new ErrorHandler(message,400);
}

  res.status(err.statusCode).json({
    success:false,
    message:err.message,// we can write err.stack to know where exactly the error is if we run the api with wrong id
  });
}
