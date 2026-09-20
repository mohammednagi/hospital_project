import EmbeddedPostgres from "embedded-postgres";
import path from "path";
import fs from "fs";

async function main() {
  const dataDir = path.resolve(process.cwd(), ".postgres-data");
  const isInitialized = fs.existsSync(path.join(dataDir, "PG_VERSION"));
  console.log("PostgreSQL data dir:", dataDir, "Initialized:", isInitialized);

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: 5432,
    user: "postgres",
    password: "postgrespassword",
    persistent: true,
    initdbFlags: ["-E", "UTF8", "--locale=C"],
  });

  if (!isInitialized) {
    console.log("Initializing PostgreSQL database cluster with UTF-8 encoding...");
    await pg.initialise();
  }

  console.log("Starting PostgreSQL server on port 5432...");
  await pg.start();
  console.log("PostgreSQL server started successfully.");

  try {
    await pg.createDatabase("smartgov_hospital");
    console.log("Created database: smartgov_hospital");
  } catch (err: any) {
    if (err.message && err.message.includes("already exists")) {
      console.log("Database smartgov_hospital already exists.");
    } else {
      console.log("Database note:", err.message);
    }
  }

  console.log("READY_FOR_CONNECTIONS on port 5432");

  const cleanup = async () => {
    console.log("Shutting down PostgreSQL...");
    await pg.stop();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // Keep process alive
  setInterval(() => {}, 1000 * 60 * 60);
}

main().catch((err) => {
  console.error("Fatal PostgreSQL error:", err);
  process.exit(1);
});
