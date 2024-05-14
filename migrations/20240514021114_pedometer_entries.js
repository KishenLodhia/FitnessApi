exports.up = function (knex) {
  return knex.schema.createTable("pedometer_entries", function (table) {
    table.increments("id");
    table.integer("user_id").unsigned().notNullable();
    table.foreign("user_id").references("id").inTable("users").onDelete("CASCADE");
    table.date("date").notNullable();
    table.integer("steps");
    table.float("distance"); // Distance covered in kilometers
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("pedometer_entries");
};
