exports.up = function (knex) {
  return knex.schema.createTable("users", function (table) {
    table.increments("id").primary().notNullable();
    table.string("email").notNullable().unique();
    table.string("hash").notNullable();
    table.string("name");
    table.integer("age");
    table.float("height");
    table.float("weight");
    table.string("fitness_goal");
    table.timestamps(true, true); // Adds created_at and updated_at columns
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("users");
};
