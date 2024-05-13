exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex("users")
    .del()
    .then(function () {
      // Inserts seed entries
      return knex("users").insert([
        {
          id: 1,
          username: "user1",
          email: "user1@example.com",
          password: "password1",
          name: "User One",
          age: 30,
          height: 170,
          weight: 70,
          fitness_goal: "Lose weight",
        },
        {
          id: 2,
          username: "user2",
          email: "user2@example.com",
          password: "password2",
          name: "User Two",
          age: 25,
          height: 180,
          weight: 80,
          fitness_goal: "Gain muscle",
        },
        {
          id: 3,
          username: "user3",
          email: "user3@example.com",
          password: "password3",
          name: "User Three",
          age: 35,
          height: 175,
          weight: 75,
          fitness_goal: "Maintain weight",
        },
      ]);
    });
};
