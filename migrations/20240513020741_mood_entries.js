exports.up = function (knex) {
  return knex.schema.createTable("mood_entries", function (table) {
    table.increments("id").primary();
    table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
    table.timestamp("timestamp").defaultTo(knex.fn.now());
    table.string("mood").notNullable();
    table.string("notes");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("mood_entries");
};
