import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const generateAccessAndRefreshTokens = async (userId) => {

    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
        
    } catch (error) {
        throw new ApiError(500, 'Error generating tokens')
    }

}

const registerUser = asyncHandler(async (req, res) => {

    const { fullname, username, email, password } = req.body
    console.log(email)

    if(
        [fullname, username, email, password].some((field) => field?.trim() === '')
    ){
        throw new ApiError(400, 'Please fill in all fields')
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })
    console.log(existedUser)
    if(existedUser){
        throw new ApiError(409, 'User already exists')
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    // if(!avatarLocalPath){
    //     throw new ApiError(400, 'Please upload avatar')
    // }
    //const avatarLocalPath = req.files && req.files.avatar && req.files.avatar.length > 0 ? req.files.avatar[0].path : null;
    //const coverImageLocalPath = req.files && req.files.coverImage && req.files.coverImage.length > 0 ? req.files.coverImage[0].path : null;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

if(!avatarLocalPath){
    throw new ApiError(400, 'Please upload avatar');
}

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(500, 'Error uploading avatar')
    }

    const user = await User.create({
        fullname,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ''
   
    })

    console.log(user)
    const createdUser = await User.findById({ _id: user._id }).select(
        '-password -refreshToken'
    )

    if(!createdUser){
        throw new ApiError(500, 'Error creating user')
    }

    res.status(201).json(
        new ApiResponse(200, createdUser, 'User created Successfully')
    )


})

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    if(!email || !username){
        throw new ApiError(400, 'Please provide email or username')
    }

    const user = await User.findOne({ $or: [{ email }, { username }] })

    if(!user){
        throw new ApiError(404, 'User does not exsit')
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, 'Invalid credentials')
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id)
    .select( '-password -refreshToken' )

    const options = {

        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json( new ApiResponse(
        200, 
        {
            user: loggedInUser, accessToken, refreshToken
        },
        'User logged in successfully'
        )
        )
})


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { 
        $set:{
            refreshToken: undefined
        }
     },
     {
        new: true
     })

     const options = {
            httpOnly: true,
            secure: true
        }

    return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(
        new ApiResponse(200, {}, 'User logged out successfully')
    )
})



export {registerUser, loginUser, logoutUser}