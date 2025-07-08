const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    Email: { type: String, required: true },
    password: { type: String }
});
userSchema.plugin(passportLocalMongoose);
module.exports = userSchema;