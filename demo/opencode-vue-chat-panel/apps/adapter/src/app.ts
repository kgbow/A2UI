import express from "express";
import { config } from "./config.js";
import { createOpencodeClient } from "./services/opencode-client.js";
import { createChatHandler } from "./routes/chat.js";
import { createPanelActionHandler } from "./routes/panel-action.js";

const app = express();
app.use(express.json());

const client = createOpencodeClient();

app.post("/api/chat", createChatHandler({ sendMessage: client.sendMessage }));
app.post(
  "/api/panel-action",
  createPanelActionHandler({ sendMessage: client.sendMessage }),
);

app.listen(config.port, () => {
  console.log(`Adapter listening on http://localhost:${config.port}`);
});
