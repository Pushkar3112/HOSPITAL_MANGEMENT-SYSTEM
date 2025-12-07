const mongoose = require("mongoose");
require("dotenv").config();

const clearDatabase = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("🗑️  Clearing ALL collections...");

    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
      console.log(`✅ Cleared: ${key}`);
    }

    console.log("\n✅ Database cleared completely!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  }
};

clearDatabase();
