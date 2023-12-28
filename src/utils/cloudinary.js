import {v2 as cloudinary} from "cloudinary";
import { log } from "console";
import fs from "fs";

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
       if(!localFilePath) return null;
       //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {resource_type: "auto"})
        //file uploaded successfully
        console.log("File uploaded successfully", response.url);
        fs.unlinkSync(localFilePath);
        return response
     
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the file from local storage
        return null
    }
}



export {uploadOnCloudinary}