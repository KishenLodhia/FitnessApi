exports.up = function (knex) {
  return knex.schema.createTable("sleep_patterns", function (table) {
    table.increments("id").primary();
    table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
    table.timestamp("start_timestamp").defaultTo(knex.fn.now());
    table.timestamp("end_timestamp").defaultTo(knex.fn.now());
    table.string("quality").notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("sleep_patterns");
};
