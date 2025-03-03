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

  const stateFilterButtons = document.querySelectorAll(".filter-button"); // Get all state filter buttons
  const filterStartDateInput = document.getElementById("filterStartDate"); // Get the filter start date input
  const filterEndDateInput = document.getElementById("filterEndDate"); // Get the filter end date input
  const applyDateFilterButton = document.getElementById("applyDateFilter"); // Get the apply date filter button

  let allPullRequests = [];
  let currentPage = 1;
  const itemsPerPage = 10;
  let currentStateFilter = "all"; // Store the current state filter
  let currentFilterStartDate = null; // Store the current filter start date
  let currentFilterEndDate = null; // Store the current filter end date

  function updateRepoHeader() {
    ownerNameElement.textContent = ownerInput.value || "YourOrg";
    repoNameElement.textContent = repoInput.value || "YourRepo";
  }

  ownerInput.addEventListener("input", updateRepoHeader);
  repoInput.addEventListener("input", updateRepoHeader);

  // Function to filter pull requests based on state and date
  function filterPullRequests() {
    let filteredPRs = allPullRequests;

    // Apply state filter
    if (currentStateFilter !== "all") {
      filteredPRs = filteredPRs.filter((pr) => pr.state === currentStateFilter);
    }

    // Apply date filter
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

  // Function to display the filtered and paginated pull requests
  function displayFilteredAndPaginatedPullRequests() {
    const filteredPRs = filterPullRequests();
    currentPage = 1; // Reset to the first page after filtering
    displayPaginatedPullRequests(filteredPRs, currentPage, itemsPerPage);
    setupPagination(filteredPRs, itemsPerPage);
  }

  // Add event listeners to the state filter buttons
  stateFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons
      stateFilterButtons.forEach((btn) => btn.classList.remove("active"));
      // Add active class to the clicked button
      button.classList.add("active");
      currentStateFilter = button.dataset.state; // Update the current state filter
      displayFilteredAndPaginatedPullRequests(); // Display the filtered results
    });
  });

  // Add event listener to the apply date filter button
  applyDateFilterButton.addEventListener("click", () => {
    currentFilterStartDate = filterStartDateInput.value; // Update the current filter start date
    currentFilterEndDate = filterEndDateInput.value; // Update the current filter end date
    displayFilteredAndPaginatedPullRequests(); // Display the filtered results
  });

  fetchButton.addEventListener("click", async () => {
    const owner = ownerInput.value;
    const repo = repoInput.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!owner || !repo || !startDate || !endDate) {
      displayError("Please fill in all fields.");
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
        endDate
      );
      currentStateFilter = "all"; // Reset the state filter to 'all'
      stateFilterButtons.forEach((btn) => btn.classList.remove("active")); // Remove active class from all buttons
      document
        .querySelector('.filter-button[data-state="all"]')
        .classList.add("active"); // Add active class to the 'All' button
      currentFilterStartDate = null; // Reset the filter start date
      currentFilterEndDate = null; // Reset the filter end date
      filterStartDateInput.value = ""; // Clear the filter start date input
      filterEndDateInput.value = ""; // Clear the filter end date input
      displayFilteredAndPaginatedPullRequests(); // Display the filtered results
    } catch (error) {
      displayError(error.message);
    } finally {
      loadingSpinner.style.display = "none";
    }
  });

  async function fetchPullRequestsFromAPI(owner, repo, startDate, endDate) {
    const apiUrl = `http://localhost:3000/pulls?owner=${owner}&repo=${repo}&startDate=${startDate}&endDate=${endDate}`;

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
      paginationContainer.innerHTML = ""; // Clear pagination if only one page
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

    paginationContainer.innerHTML = ""; // Clear previous pagination
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
