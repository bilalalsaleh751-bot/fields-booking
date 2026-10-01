import mongoose from "mongoose";

// Plain-English hint for the most common Atlas connection failures
const hintFor = (err) => {
  const msg = `${err?.name || ""} ${err?.message || ""}`;
  if (/bad auth|authentication failed/i.test(msg)) {
    return "The username or password in the connection string is wrong.";
  }
  if (/ENOTFOUND|querySrv|EAI_AGAIN/i.test(msg)) {
    return "The cluster address in the connection string is wrong, or the cluster was deleted.";
  }
  if (/whitelist|ServerSelection/i.test(msg)) {
    return "Atlas -> Network Access must allow this server's IP (Render needs 0.0.0.0/0). Also check the cluster is not paused.";
  }
  return "Check the connection string and that the Atlas cluster is running.";
};

const connectDB = async () => {
  // Support both names: MONGODB_URI (common on hosting dashboards) and MONGO_URI
  const source = process.env.MONGODB_URI ? "MONGODB_URI" : process.env.MONGO_URI ? "MONGO_URI" : null;
  if (!source) {
    console.error("❌ DB config error: MONGODB_URI (or MONGO_URI) is not set.");
    console.error("   Set it in Render -> Environment, or in backend/.env when running locally.");
    process.exit(1);
  }

  const uri = process.env[source];
  // Show which cluster we connect to, never the username or password
  const host = uri.replace(/^mongodb(\+srv)?:\/\/([^@/]*@)?/, "").split(/[/?]/)[0];
  console.log(`🔌 Connecting to MongoDB using ${source} (host: ${host})...`);

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host} (database: ${conn.connection.name})`);
  } catch (err) {
    console.error(`❌ DB Connection Error (${err.name}): ${err.message}`);
    console.error(`   Hint: ${hintFor(err)}`);
    process.exit(1);
  }

  // Problems after startup (network drops, Atlas maintenance)
  mongoose.connection.on("disconnected", () => console.error("⚠️  MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => console.log("✅ MongoDB reconnected"));
  mongoose.connection.on("error", (err) => console.error(`❌ MongoDB error (${err.name}): ${err.message}`));
};

export default connectDB;
