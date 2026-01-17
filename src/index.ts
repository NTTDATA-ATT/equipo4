import "dotenv/config";
import { createStore } from "./infra/store";
import { buildApp } from "./app";

const PORT = Number(process.env.PORT ?? 3000);

const store = createStore();
const app = buildApp(store);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`telco-billing-service-ts on :${PORT}`);
});
