 const app = require("./app");

const dotenv = require("dotenv");
const connectDatabase = require("./config/database")


//handling uncaught Exception
process.on("unhandhledRejection",(err)=>{
  console.log("Error: ${err.message}");
  console.log("Shutting down the server due to uncaught exception");
  process.exit(1);
});



// config

dotenv.config({path: "backend/config/config.env"})

//connecting database
connectDatabase()

 const server = app.listen(process.env.PORT,()=>{
   console.log("Server is running on http://localhost:${process.env.PORT}");
 });


 //unhandhled promise rejection

 process.on("unhandhledRejection",err=>{
   console.log("Error: ${err.message}");
   console.log("Shutting down the server");

   server.close(()=>{
     process.exit(1);
   });
 });
