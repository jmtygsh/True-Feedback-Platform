import React from "react";

import { auth } from "@/auth";

const Dashboard = async () => {
  const session = await auth();

  return (
    <div>
      Welcome,
      {session?.user?.username}! Now, you are login.
    </div>
  );
};

export default Dashboard;
