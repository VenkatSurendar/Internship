const mongoose = require("mongoose");

mongoose.set("debug", true);
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost:27017/talset", {
    keepAlive : true,
    useNewUrlParser : true,
    useUnifiedTopology : true,
    useCreateIndex : true
});
mongoose.connection.once("open", function() {
    console.log("MongoDB database connection established successfully");
});

module.exports.User = require("../models/user");