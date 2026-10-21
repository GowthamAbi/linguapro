import "dotenv/config";
import app from "./app";
import { connectDatabase } from "./config/database";

const port = Number(process.env.PORT ?? 4000);

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    app.listen(port, () => console.info("LinguaPro API listening on port " + port + "."));
  } catch (error) {
    console.error("Unable to start LinguaPro API.", error);
    process.exit(1);
  }
}

void startServer();