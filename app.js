// Load environment variables in development
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
//https://yelpcamp-1-e9s2.onrender.com
console.log("SECRET:", process.env.SECRET);
console.log("API_KEY:", process.env.API_KEY);

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require("helmet");
const mongoSanitize = require('express-mongo-sanitize');

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

const MongoDBStore = require('connect-mongo')(session)

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp-maptiler';

// Connect to MongoDB
mongoose.connect(dbUrl)
    .then(() => console.log('✅ MongoDB connection open!'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const app = express();

// Set up EJS and views
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize({ replaceWith: '_' }));

const store = new MongoDBStore({
    url: dbUrl,
    secret: 'thisshoudbeabettersecret',
    touchAfter: 24 * 60 * 60
})
store.on('error', function (e) {
    console.log("session store error", e)
})
// Session configuration
const sessionConfig = {
    store,
    name: 'session',
    secret: process.env.SECRET || 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true, // uncomment when deploying with HTTPS
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};
app.use(session(sessionConfig));
app.use(flash());

// Helmet security setup
app.use(helmet());

// Allowed external sources for Helmet CSP
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/",
];
const connectSrcUrls = [
    "https://api.maptiler.com/",
    "https://cdn.maptiler.com/",
    "https://cdn.jsdelivr.net/"
];
const fontSrcUrls = [];

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'self'", "'unsafe-inline'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", 'blob:'],
            objectSrc: [],
            imgSrc: [
                "'self'",
                'blob:',
                'data:',
                'https://api.maptiler.com/',
                'https://res.cloudinary.com/',  // Cloudinary images
                'https://images.unsplash.com/', // Unsplash images
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash + currentUser middleware
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Temporary route for testing user registration (use once)
app.get('/fakeUser', async (req, res) => {
    const user = new User({ email: 'adil@gmail.com', username: 'adil' });
    const newUser = await User.register(user, 'chicken');
    res.send(newUser);
});

// Route handlers
app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

// Home route
app.get('/', (req, res) => {
    res.render('home');
});

// 404 handler
app.all('*', (req, res, next) => {
    next(new ExpressError('Page not found', 404));
});

// Error handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Oh no, something went wrong!";
    res.status(statusCode).render('error', { err });
});

// Start server
app.listen(3000, () => {
    console.log("🚀 Serving on port 3000");
});
