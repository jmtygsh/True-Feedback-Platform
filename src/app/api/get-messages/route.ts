import { auth } from "@/auth";
import connectToDatabase from "@/lib/dbConnection";
import UserModel from "@/models/User";
import mongoose from "mongoose";

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

  const { _id } = session?.user;

  // I would like to do aggregation of mongodb beacuse, i want to get all messages for a user and their statue

  // we can use get all directly message array dumb into jsx but we need to consider the performance and data structure

  // Just imagine what if user has 10,000 messages ?

  try {
    const user = await UserModel.aggregate([
      // 1. Match the specific user by _id (convert string to ObjectId)
      {
        $match: { _id: new mongoose.Types.ObjectId(_id) },
      },

      // 2. Break the messages array into individual documents
      { $unwind: "$messages" },

      // 3. Sort the messages by createdAt (descending = newest first)
      { $sort: { "messages.createdAt": -1 } },

      // 4. Group back into a single document
      //    Collect all messages back into an array, now sorted
      {
        $group: {
          _id: "$_id",
          messages: { $push: "$messages" },
        },
      },
    ]);

    if (!user || user.length === 0) {
      return Response.json(
        {
          success: false,
          message: "No messages found for the user",
        },
        { status: 404 }
      );
    }

    // console.log("aggregation ============================>", user);

    return Response.json(
      {
        success: true,
        messages: user[0].messages,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
