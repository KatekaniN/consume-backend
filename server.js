const express = require("express");
const cors = require("cors");
const path = require("path");
const { getPullRequests } = require("./src/consume_github_api");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get("/pulls", async (req, res) => {
  try {
    const { owner, repo, startDate, endDate } = req.query;
    const pullRequests = await getPullRequests({
      owner,
      repo,
      startDate,
      endDate,
    });
    res.json(pullRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
