exports.up = function (knex) {
  return knex.schema.createTable("water_intake", function (table) {
    table.increments("id").primary();
    table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
    table.timestamp("timestamp").defaultTo(knex.fn.now());
    table.float("amount").notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("water_intake");
};
