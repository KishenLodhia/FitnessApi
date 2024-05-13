exports.up = function (knex) {
  return knex.schema.createTable("activity_logs", function (table) {
    table.increments("id").primary();
    table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
    table.timestamp("timestamp").defaultTo(knex.fn.now());
    table.string("type").notNullable();
    table.float("value").notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("activity_logs");
};
