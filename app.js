require('dotenv').config();
const express=require("express");
const app=express();
app.set("view engine","ejs");
const mongoose = require("mongoose");
const path=require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");
const methodOverride = require('method-override');
const MongoStore = require("connect-mongo");

const mainConnection = mongoose.createConnection(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = require("./user.js");
const ideaSchema = require("./idea.js");

const User = mainConnection.model("User", userSchema);
const Idea = mainConnection.model("Idea", ideaSchema);

app.use(session({
  secret: process.env.SESSION_SECRET || "fallbacksecret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    collectionName: "sessions"
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    next();
})

app.set("views",path.join(__dirname,"/views"));
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login",(req,res)=>{
    res.render("loginPage.ejs");
});
app.post("/login", passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: "Invalid username or password"
}), (req, res) => {
    req.flash("success", "Successfully logged in!");
    res.redirect("/home");
})
app.get("/signUp",(req,res)=>{
    res.render("signUp.ejs");
});
app.get("/home",async(req,res)=>{
    let ideas= await Idea.find();
    res.render("Home",{ideas});
});

app.post("/signUp", async (req, res) => {
    try {
        let { username, Email, password } = req.body;
        const newUser = new User({ username, Email });
        const regUser = await User.register(newUser, password);
        req.login(regUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome!");
            res.redirect("/login");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signUp");
    }
});
const seedUser = async () => {
    const existing = await User.findOne({ username: "demoUser" });
    if (!existing) {
        const user = new User({ username: "demoUser", Email: "demo@example.com",password:"demopassword" });
        const newUser = await User.register(user, "demopassword");
        console.log("Demo user created:", newUser.username);
    } else {
        console.log("Demo user already exists");
    }
};
seedUser();
app.get("/new",(req,res)=>{
    res.render("new");
})
app.post("/new", async (req, res) => {
    let { title, idea } = req.body;
    const newIdea = new Idea({
        title: title,
        idea: idea,
    });
    await newIdea.save();
    res.redirect("/home");
});
app.get("/idea/:id", async (req, res) => {
    const { id } = req.params;
    const ideaDoc = await Idea.findById(id);
    if (!ideaDoc) {
        return res.status(404).send("Idea not found");
    }
    res.render("fullPage", { id,title: ideaDoc.title, idea: ideaDoc.idea});
});
app.get("/idea/:id/edit",async(req,res)=>{
    const { id } = req.params;
    const ideaDoc = await Idea.findById(id);
    if (!ideaDoc) {
        return res.status(404).send("Idea not found");
    }
    res.render("Edit", { id,title: ideaDoc.title, idea: ideaDoc.idea});
});
app.patch("/idea/:id", async (req, res) => {
    const { id } = req.params;
    const { title, idea } = req.body;
    await Idea.findByIdAndUpdate(id, { title, idea });
    res.redirect(`/idea/${id}`);
});
app.get("/idea/:id/delete",async(req,res)=>{
    const { id } = req.params;
    const ideaDoc = await Idea.findById(id);
    if (!ideaDoc) {
        return res.status(404).send("Idea not found");
    }
    res.render("Edit", { id,title: ideaDoc.title, idea: ideaDoc.idea});
});
app.delete("/idea/:id", async (req, res) => {
    const { id } = req.params;
    await Idea.findByIdAndDelete(id);
    res.redirect("/home");
});
app.listen(3000,()=>{
    console.log("server is running fine!");
});