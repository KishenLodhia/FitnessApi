exports.seed = function (knex) {
  return knex("pedometer_entries")
    .del()
    .insert([
      { user_id: 1, date: "2024-05-01", steps: 8000, distance: 6.5 },
      { user_id: 1, date: "2024-05-02", steps: 10000, distance: 8.0 },
      { user_id: 1, date: "2024-05-03", steps: 7500, distance: 6.0 },
      { user_id: 1, date: "2024-05-04", steps: 9000, distance: 7.2 },
      { user_id: 1, date: "2024-05-05", steps: 11000, distance: 8.8 },
      { user_id: 1, date: "2024-05-06", steps: 8500, distance: 6.8 },
      { user_id: 1, date: "2024-05-07", steps: 9500, distance: 7.6 },
      { user_id: 1, date: "2024-05-08", steps: 10500, distance: 8.4 },
      { user_id: 1, date: "2024-05-09", steps: 7000, distance: 5.6 },
      { user_id: 1, date: "2024-05-10", steps: 12000, distance: 9.6 },
    ])
    .then(function () {
      return knex("pedometer_entries").insert([
        { user_id: 2, date: "2024-05-01", steps: 6000, distance: 4.8 },
        { user_id: 2, date: "2024-05-02", steps: 12000, distance: 9.6 },
        { user_id: 2, date: "2024-05-03", steps: 8500, distance: 6.8 },
        { user_id: 2, date: "2024-05-04", steps: 9500, distance: 7.6 },
        { user_id: 2, date: "2024-05-05", steps: 10500, distance: 8.4 },
        { user_id: 2, date: "2024-05-06", steps: 7000, distance: 5.6 },
        { user_id: 2, date: "2024-05-07", steps: 11000, distance: 8.8 },
        { user_id: 2, date: "2024-05-08", steps: 8000, distance: 6.5 },
        { user_id: 2, date: "2024-05-09", steps: 10000, distance: 8.0 },
        { user_id: 2, date: "2024-05-10", steps: 7500, distance: 6.0 },
      ]);
    });
};
