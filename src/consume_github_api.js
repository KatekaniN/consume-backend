const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const axios = require("axios");
const GITHUB_API_URL = "https://api.github.com";

function getHeaders(token) {
  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "consume-github-api", 
      }
    : {};
}

async function validateOwner(owner, token) {
  console.log("Validating Owner:", owner, "Token:", token);
  try {
    const url = `${GITHUB_API_URL}/users/${owner}`;
    const headers = getHeaders(token);
    console.log("Axios Config:", { url, headers });
    await axios.get(url, { headers });
  } catch (error) {
    console.error("validateOwner Error:", error); // Log the full error
    if (error.response) {
      console.error("Response Data:", error.response.data); // Log the response data
      console.error("Response Status:", error.response.status); // Log the response status
      console.error("Response Headers:", error.response.headers); // Log the response headers
    }
    if (error.response && error.response.status === 404) {
      throw new Error(`User ${owner} not found.`);
    } else {
      throw new Error(
        `An error occurred while validating owner: ${
          error.message || "Unknown error"
        }`
      );
    }
  }
}

async function validateRepo(owner, repo, token) {
  console.log("Validating Repo:", owner, repo, "Token:", token);
  try {
    const url = `${GITHUB_API_URL}/repos/${owner}/${repo}`;
    const headers = getHeaders(token);
    console.log("Axios Config:", { url, headers });
    await axios.get(url, { headers });
  } catch (error) {
    console.error("validateRepo Error:", error); // Log the full error
    if (error.response) {
      console.error("Response Data:", error.response.data); // Log the response data
      console.error("Response Status:", error.response.status); // Log the response status
      console.error("Response Headers:", error.response.headers); // Log the response headers
    }
    if (error.response && error.response.status === 404) {
      throw new Error(`Repo ${repo} not found.`);
    } else {
      throw new Error(
        `An error occurred while validating repository: ${
          error.message || "Unknown error"
        }`
      );
    }
  }
}

async function validateInputs({ owner, repo, token }) {
  await Promise.all([
    validateOwner(owner, token),
    validateRepo(owner, repo, token),
  ]);
}

async function fetchPullRequests(owner, repo, token) {
  try {
    await validateInputs({ owner, repo, token });
  } catch (validationError) {
    // Re-throw the validation error to prevent fetching PRs with invalid inputs
    throw validationError;
  }

  let allPullRequests = [];
  let page = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    try {
      const response = await axios.get(
        `${GITHUB_API_URL}/repos/${owner}/${repo}/pulls`,
        {
          params: {
            state: "all",
            direction: "desc",
            per_page: 100,
            page,
          },
          headers: getHeaders(token),
        }
      );
      allPullRequests = allPullRequests.concat(response.data);
      hasMorePages =
        response.headers.link && response.headers.link.includes('rel="next"');
      page++;
    } catch (error) {
      throw new Error(
        `An error occurred while fetching pull requests: ${
          error.message || "Unknown error"
        }`
      );
    }
  }
  return allPullRequests;
}

function filterPullRequests(allPullRequests, startDate, endDate) {
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  endDateObj.setHours(23, 59, 59);

  return allPullRequests.filter((request) => {
    const createdAt = new Date(request.created_at);
    const updatedAt = request.updated_at ? new Date(request.updated_at) : null;
    const closedAt = request.closed_at ? new Date(request.closed_at) : null;
    const mergedAt = request.merged_at ? new Date(request.merged_at) : null;

    return (
      (createdAt >= startDateObj && createdAt <= endDateObj) ||
      (updatedAt && updatedAt >= startDateObj && updatedAt <= endDateObj) ||
      (closedAt && closedAt >= startDateObj && closedAt <= endDateObj) ||
      (mergedAt && mergedAt >= startDateObj && mergedAt <= endDateObj)
    );
  });
}

function formatPullRequests(filteredPRs) {
  return filteredPRs.map((request) => ({
    id: request.id,
    user: request.user.login,
    title: request.title,
    state: request.state,
    created_at: request.created_at.substring(0, 10),
  }));
}

async function getPullRequests({ owner, repo, startDate, endDate, token }) {
  try {
    const allPullRequests = await fetchPullRequests(owner, repo, token);
    const filteredPRs = filterPullRequests(allPullRequests, startDate, endDate);
    return formatPullRequests(filteredPRs);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getPullRequests,
};
/*
getPullRequests({
  owner: "Umuzi-org",
  repo: "ACN-syllabus",
  startDate: "2022-03-01",
  endDate: "2022-03-10",
  token: process.env.GITHUB_TOKEN
}).then((res) => console.log(res));*/
