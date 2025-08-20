import UserModel from "@/models/User";
import { Message } from "@/models/User";
import connectToDatabase from "@/lib/dbConnection";

export async function POST(request: Request) {
  await connectToDatabase();
  const { username, content } = await request.json();

  try {
    const user = await UserModel.findOne({ username });
    if (!user) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // is user accepting messages
    if (!user.isAcceptingMessages) {
      return Response.json(
        {
          success: false,
          message: "User is not accepting messages",
        },
        { status: 403 }
      );
    }

    const newMessage = {
      content,
      createdAt: new Date(),
    };

    // storing message in messages array of user
    user.messages.push(newMessage as Message);
    await user.save();

    return Response.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error finding user:", error);
    return Response.json({
      success: false,
      message: "Message not sent",
    });
  }
}
