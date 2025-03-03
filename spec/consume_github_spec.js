const axios = require("axios");
const { rawData, processedData, callData } = require("./helpers/data.js");
const { getPullRequests } = require("../src/consume_github_api.js");

describe("GitHub API Interactions", () => {
  const GITHUB_API_URL = "https://api.github.com";

  let axiosSpy;

  beforeEach(() => {
    process.env.GITHUB_TOKEN = "mockToken";

    axiosSpy = spyOn(axios, "get").and.returnValue(Promise.resolve(rawData));
    spyOn(axios, "head").and.returnValue(Promise.resolve());
  });

  afterEach(() => {
    axiosSpy.calls.reset();
  });

  describe("getPullRequests", () => {
    it("should make a successful API request with the correct parameters", async () => {
      await getPullRequests(callData);

      expect(axiosSpy).toHaveBeenCalledOnceWith(
        `${GITHUB_API_URL}/repos/${callData.owner}/${callData.repo}/pulls`,
        {
          params: {
            state: "all",
            direction: "desc",
            per_page: 100,
            page: 1,
          },
          headers: { Authorization: `token mockToken` },
        }
      );
    });
  });

  describe("filterPullRequests", () => {
    it("should filter pull requests", async () => {
      const result = await getPullRequests(callData);
      expect(result).toEqual(processedData);
    });
  });
});
