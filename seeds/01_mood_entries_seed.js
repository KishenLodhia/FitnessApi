exports.seed = function (knex) {
  return knex("mood_entries")
    .del()
    .then(function () {
      return knex("mood_entries").insert([
        { user_id: 1, mood: "happy", notes: "Feeling great today!", timestamp: new Date() },
        { user_id: 1, mood: "sad", notes: "Had a tough day.", timestamp: new Date() },
        { user_id: 2, mood: "excited", notes: "Feeling pumped up!", timestamp: new Date() },
        { user_id: 1, mood: "sad", notes: "Alot of work", timestamp: new Date() },
        { user_id: 2, mood: "excited", notes: "Went to gym", timestamp: new Date() },
      ]);
    });
};
