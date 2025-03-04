const express = require("express");
const cors = require("cors");
const { getPullRequests } = require("./src/consume_github_api");

const app = express();
const port = 3000;

app.use(cors());

app.get("/pulls", async (req, res) => {
  try {
    const { owner, repo, startDate, endDate, token } = req.query;
    const decodedToken = decodeURIComponent(token);
    console.log("Decoded Token:", decodedToken);

    if (!decodedToken) {
      return res.status(401).json({ error: "GitHub token is missing." });
    }

    const pullRequests = await getPullRequests({
      owner,
      repo,
      startDate,
      endDate,
      token: decodedToken,
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
