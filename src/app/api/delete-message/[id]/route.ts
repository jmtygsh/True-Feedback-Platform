import { auth } from "@/auth";
import connectToDatabase from "@/lib/dbConnection";
import UserModel from "@/models/User";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  await connectToDatabase();

  const messageId = params.id;
  const userId = session.user._id;

  try {
    // Remove a specific message (by messageId) from the user's messages array
    const updateResult = await UserModel.updateOne(
      { _id: userId }, // Find the user by their _id
      { $pull: { messages: { _id: messageId } } } // Pull (remove) the message with the matching _id from messages array
    );

    if (updateResult.modifiedCount === 0) {
      return Response.json(
        { message: "Message not found or already deleted", success: false },
        { status: 404 }
      );
    }

    return Response.json(
      { message: "Message deleted", success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting message:", error);
    return Response.json(
      { message: "Error deleting message", success: false },
      { status: 500 }
    );
  }
}
