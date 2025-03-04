document.addEventListener("DOMContentLoaded", () => {
  const fetchButton = document.getElementById("fetchButton");
  const ownerInput = document.getElementById("owner");
  const repoInput = document.getElementById("repo");
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const resultsContainer = document.getElementById("results");
  const errorMessage = document.getElementById("error-message");
  const paginationContainer = document.getElementById("pagination");
  const loadingSpinner = document.createElement("div");
  loadingSpinner.classList.add("loading-spinner");

  const ownerNameElement = document.querySelector(".owner-name");
  const repoNameElement = document.querySelector(".repo-name");

  const stateFilterButtons = document.querySelectorAll(".filter-button");
  const filterStartDateInput = document.getElementById("filterStartDate");
  const filterEndDateInput = document.getElementById("filterEndDate");
  const applyDateFilterButton = document.getElementById("applyDateFilter");
  const githubTokenInput = document.getElementById("githubToken");

  let allPullRequests = [];
  let currentPage = 1;
  const itemsPerPage = 10;
  let currentStateFilter = "all";
  let currentFilterStartDate = null;
  let currentFilterEndDate = null;

  function updateRepoHeader() {
    ownerNameElement.textContent = ownerInput.value || "YourOrg";
    repoNameElement.textContent = repoInput.value || "YourRepo";
  }

  ownerInput.addEventListener("input", updateRepoHeader);
  repoInput.addEventListener("input", updateRepoHeader);

  function filterPullRequests() {
    let filteredPRs = allPullRequests;

    if (currentStateFilter !== "all") {
      filteredPRs = filteredPRs.filter((pr) => pr.state === currentStateFilter);
    }

    if (currentFilterStartDate && currentFilterEndDate) {
      const startDateObj = new Date(currentFilterStartDate);
      const endDateObj = new Date(currentFilterEndDate);
      filteredPRs = filteredPRs.filter((pr) => {
        const createdAt = new Date(pr.created_at);
        return createdAt >= startDateObj && createdAt <= endDateObj;
      });
    }

    return filteredPRs;
  }

  function displayFilteredAndPaginatedPullRequests() {
    const filteredPRs = filterPullRequests();
    currentPage = 1;
    displayPaginatedPullRequests(filteredPRs, currentPage, itemsPerPage);
    setupPagination(filteredPRs, itemsPerPage);
  }

  stateFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      stateFilterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentStateFilter = button.dataset.state;
      displayFilteredAndPaginatedPullRequests();
    });
  });

  applyDateFilterButton.addEventListener("click", () => {
    currentFilterStartDate = filterStartDateInput.value;
    currentFilterEndDate = filterEndDateInput.value;
    displayFilteredAndPaginatedPullRequests();
  });

  fetchButton.addEventListener("click", async () => {
    const owner = ownerInput.value;
    const repo = repoInput.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const githubToken = githubTokenInput.value;

    if (!owner || !repo || !startDate || !endDate || !githubToken) {
      displayError("Please fill in all fields, including the GitHub token.");
      return;
    }

    resultsContainer.innerHTML = "";
    hideError();
    paginationContainer.innerHTML = "";

    resultsContainer.appendChild(loadingSpinner);
    loadingSpinner.style.display = "block";

    try {
      allPullRequests = await fetchPullRequestsFromAPI(
        owner,
        repo,
        startDate,
        endDate,
        encodeURIComponent(githubToken)
      );
      currentStateFilter = "all";
      stateFilterButtons.forEach((btn) => btn.classList.remove("active"));
      document
        .querySelector('.filter-button[data-state="all"]')
        .classList.add("active");
      currentFilterStartDate = null;
      currentFilterEndDate = null;
      filterStartDateInput.value = "";
      filterEndDateInput.value = "";
      displayFilteredAndPaginatedPullRequests();
    } catch (error) {
      displayError(error.message);
    } finally {
      loadingSpinner.style.display = "none";
    }
  });

  async function fetchPullRequestsFromAPI(
    owner,
    repo,
    startDate,
    endDate,
    githubToken
  ) {
  
    console.log("Token Data Type:", typeof githubToken);
    console.log("Token being sent:", githubToken);
    const encodedToken = encodeURIComponent(githubToken); 
    const apiUrl = `http://localhost:3000/pulls?owner=${owner}&repo=${repo}&startDate=${startDate}&endDate=${endDate}&token=${encodedToken}`;

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch pull requests: ${error.message}`);
    }
  }

  function displayPaginatedPullRequests(pullRequests, page, perPage) {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedPRs = pullRequests.slice(startIndex, endIndex);

    resultsContainer.innerHTML = "";

    if (paginatedPRs.length === 0) {
      resultsContainer.innerHTML =
        "<p>No pull requests found for the given criteria.</p>";
      return;
    }

    const ul = document.createElement("ul");
    paginatedPRs.forEach((pr) => {
      const li = document.createElement("li");
      li.innerHTML = `
              <strong>${pr.title}</strong><br>
              User: ${pr.user}<br>
              State: ${pr.state}<br>
              Created: ${pr.created_at}
          `;
      ul.appendChild(li);
    });

    resultsContainer.appendChild(ul);
  }

  function setupPagination(pullRequests, perPage) {
    const totalPages = Math.ceil(pullRequests.length / perPage);

    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }

    const ul = document.createElement("ul");
    ul.classList.add("pagination-list");

    // Previous button
    const prevLi = document.createElement("li");
    prevLi.classList.add("pagination-item");
    const prevLink = document.createElement("a");
    prevLink.href = "#";
    prevLink.textContent = "Previous";
    prevLink.addEventListener("click", (event) => {
      event.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        displayPaginatedPullRequests(pullRequests, currentPage, perPage);
        updateActivePage(ul);
      }
    });
    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);

    // Page number buttons
    for (let i = 1; i <= totalPages; i++) {
      const pageLi = document.createElement("li");
      pageLi.classList.add("pagination-item");
      const pageLink = document.createElement("a");
      pageLink.href = "#";
      pageLink.textContent = i;
      pageLink.addEventListener("click", (event) => {
        event.preventDefault();
        const pageNumber = parseInt(event.target.textContent);
        currentPage = pageNumber;
        displayPaginatedPullRequests(pullRequests, currentPage, perPage);
        updateActivePage(ul);
      });
      pageLi.appendChild(pageLink);
      ul.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement("li");
    nextLi.classList.add("pagination-item");
    const nextLink = document.createElement("a");
    nextLink.href = "#";
    nextLink.textContent = "Next";
    nextLink.addEventListener("click", (event) => {
      event.preventDefault();
      if (currentPage < totalPages) {
        currentPage++;
        displayPaginatedPullRequests(pullRequests, currentPage, perPage);
        updateActivePage(ul);
      }
    });
    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);

    paginationContainer.innerHTML = "";
    paginationContainer.appendChild(ul);
    updateActivePage(ul);

    prevLi.classList.toggle("disabled", currentPage === 1);
    nextLi.classList.toggle("disabled", currentPage === totalPages);
  }

  function updateActivePage(paginationList) {
    const pageLinks = paginationList.querySelectorAll("a");
    pageLinks.forEach((link, index) => {
      if (parseInt(link.textContent) === currentPage) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  function displayError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
  }

  function hideError() {
    errorMessage.style.display = "none";
  }

  updateRepoHeader();
});
