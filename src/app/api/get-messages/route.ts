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

  //   this will convert into object id
  const userId = new mongoose.Types.ObjectId(_id);

  try {
    const user = await UserModel.aggregate([
      // macth the id
      { $match: { id: userId } },

      // all messages are array but when we use unwind it will deconstruct the array. now can access directly like a object
      { $unwind: "$messages" },

      // sorting base on createdAt descending
      { $sort: { "messages.createdAt": -1 } },

      // now we can group them all
      { $group: { _id: "$_id", messages: { $push: "$messages" } } },
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

    console.log("aggregation ============================>", user);

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
