import { z } from "zod";

import connectToDatabase from "@/lib/dbConnection";
import UserModel from "@/models/User";
import { usernameValidationSchema } from "@/schemas/signUpSchema";

// To check if the username is unique as application rule
// Fast call to check username is available or not? instead multiple call api

const userNameQuerySchema = z.object({
  username: usernameValidationSchema,
});

export async function GET(request: Request) {
  await connectToDatabase();

  try {
    const { searchParams } = new URL(request.url);
    const queryParam = { username: searchParams.get("username") };

    // validate with zod
    const result = userNameQuerySchema.safeParse(queryParam);
    console.log("result", result);

    if (!result.success) {
      const usernameError = result.error.format().username?._errors || [];

      return Response.json(
        {
          success: false,
          message:
            usernameError?.length > 0
              ? usernameError.join(", ")
              : "Invalid username format",
        },
        {
          status: 400,
        }
      );
    }

    const { username } = result.data;

    const existingVerifyUser = await UserModel.findOne({
      username,
      isVerified: true,
    });

    if (existingVerifyUser) {
      return Response.json(
        {
          success: false,
          message: "Username is already taken",
        },
        {
          status: 400,
        }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Username is available",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error checking username:", error);
    return Response.json(
      {
        success: false,
        message: "Error checking username",
      },
      {
        status: 500,
      }
    );
  }
}
