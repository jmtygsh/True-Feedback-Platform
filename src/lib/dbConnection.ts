import mongoose from "mongoose";

type ConnectionObject = {
  isConnected?: number;
};

// store connection
const connectionDb: ConnectionObject = {};

async function connectToDatabase(): Promise<void> {
  // checking if database is already connected
  if (connectionDb.isConnected) {
    console.log("Already connected to the database");
    return;
  }

  //   if database not connected then connect
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || "", {});

    // store connection will get number here
    connectionDb.isConnected = db.connections[0].readyState;

    // console.log("Database connected successfully", db);
  } catch (error) {
    console.error("Error connecting to the database:", error);

    // if database not connected then
    // exit beacause our app will not work
    // anyway
    // process.exit(1);
  }
}

export default connectToDatabase;
