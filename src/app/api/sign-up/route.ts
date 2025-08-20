import connectToDatabase from "@/lib/dbConnection";
import UserModel from "@/models/User";
import bcrypt from "bcrypt";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(request: Request) {
  await connectToDatabase();

  console.log(request);

  try {
    const { username, email, password } = await request.json();

    const exitingUserVerifiedByUsername = await UserModel.findOne({
      username,
      isVerified: true,
    });

    if (exitingUserVerifiedByUsername) {
      return Response.json(
        {
          success: false,
          message: "Username is already present!",
        },
        { status: 400 }
      );
    }

    const existingUserByEmail = await UserModel.findOne({ email });

    // otp generate
    // Math.random() give value between 0 to 1 ex: 0.5225524885143897
    // 10,0000 ensure that every time code generate it should be 6 digit
    // 90,0000 is random value (range: 100000 to 999999)
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return Response.json(
          {
            success: false,
            message: "User already exist with this email",
          },
          { status: 400 }
        );
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        // email present & not verify then create new password and update
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);
        await existingUserByEmail.save();
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const expiryDate = new Date();

      //   current time to next more 1 hour for expire
      expiryDate.setHours(expiryDate.getHours() + 1);

      //   assigning to user data for database
      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry: expiryDate,
        isVerified: false,
        isAcceptingMessages: true,
        messages: [],
      });

      //   saving user to database mongo
      await newUser.save();
    }

    //send verification email
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );

    // need to check if error if emailResponse
    if (!emailResponse.success) {
      return Response.json(
        {
          success: false,
          message: emailResponse.message || "Verification email sending failed",
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "User registered successfully, please verify your email",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering user", error);
    return Response.json(
      {
        success: false,
        message: "Error registering user",
      },
      {
        status: 500,
      }
    );
  }
}
