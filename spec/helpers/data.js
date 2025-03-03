const rawData = {
  headers: { link: "" },
  data: [
    {
      id: 1,
      title: "true",
      user: {
        login: "user1",
      },
      state: "closed",
      created_at: "2022-07-01T00:00:00.000Z",
      merged_at: "2022-07-01T00:00:00.000Z",
      updated_at: "2022-07-01T00:00:00.000Z",
      closed_at: "2022-07-01T00:00:00.000Z",
    },
    {
      id: 3,
      title: "true",
      user: {
        login: "user3",
      },
      state: "closed",
      created_at: "2022-07-01T00:00:00.000Z",
      updated_at_at: "2022-07-01T00:00:00.000Z",
      merged_at: "2022-07-01T00:00:00.000Z",
      closed_at: "2022-07-01T00:00:00.000Z",
    },
  ],
};

processedData = [
  {
    id: 1,
    title: "true",
    user: "user1",
    state: "closed",
    created_at: "2022-07-01",
  },
  {
    id: 3,
    title: "true",
    user: "user3",
    state: "closed",
    created_at: "2022-07-01",
  },
];

callData = {
  owner: "Umuzi-org",
  repo: "ACN-syllabus",
  startDate: "2022-07-01",
  endDate: "2022-07-31",
};
module.exports = { rawData, processedData, callData };
