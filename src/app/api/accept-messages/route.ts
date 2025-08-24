import { auth } from "@/auth";
import connectToDatabase from "@/lib/dbConnection";
import UserModel from "@/models/User";

export async function POST(request: Request) {
  const session = await auth();

  await connectToDatabase();

  if (!session || !session.user) {
    return Response.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const { _id: userId } = session?.user;

  // This is for toggle of message acceptance
  const { acceptMessages } = await request.json();

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { isAcceptingMessages: acceptMessages },
      { new: true }
    );

    if (!updatedUser) {
      return Response.json(
        {
          success: false,
          message: "Failed to update message acceptance",
        },
        { status: 401 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Toggle updated successfully",
        updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Failed to update message acceptance:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to update message acceptance",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await auth();
  await connectToDatabase();

  if (!session || !session.user) {
    return Response.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const { _id: userId } = session?.user;

  try {
    const foundUser = await UserModel.findById(userId);

    if (!foundUser) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        isAcceptingMessages: foundUser.isAcceptingMessages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Failed to retrieve message acceptance status:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to retrieve message acceptance status",
      },
      { status: 500 }
    );
  }
}
