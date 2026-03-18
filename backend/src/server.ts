import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`Servidor API corriendo en http://localhost:${env.port}`);
});
