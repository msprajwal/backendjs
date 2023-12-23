import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try{
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`\nMongoDB Connected !! DB_HOST: ${connectionInstance.connection.host}`);
    } catch (error){
        console.log("MongoDB Connection FAILED", error);
        process.exit(1);
    }

}
export default connectDB;