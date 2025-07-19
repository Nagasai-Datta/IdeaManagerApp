const mongoose = require("mongoose");
const ideaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    idea: { type: String, required: true },
    images: [{ type: String}]
});
module.exports = ideaSchema;