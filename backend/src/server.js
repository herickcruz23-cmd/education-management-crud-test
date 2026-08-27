const { app } = require("./app.js");
const { env, db } = require("./config");

const PORT = env.PORT;

db.query("SELECT 1")
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((error) => {
    console.error(
      "Unable to connect to PostgreSQL. Check that Postgres is running and DATABASE_URL in backend/.env is correct."
    );
    console.error(error.message);
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
