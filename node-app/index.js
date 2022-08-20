const express = require('express');
const mongoose = require('mongoose');
const os = require('os');
const session = require("express-session");
const cors = require('cors');
let RedisStore = require("connect-redis")(session);
const { 
    MONGO_USER, 
    MONGO_PASSWORD, 
    MONGO_IP, 
    MONGO_PORT, 
    REDIS_URL, 
    REDIS_PORT,
    SESSION_SECRET 
} = require("./config/config.js");

const app = express();

// --------------------------------------------------------------------------------------------
// database connection
// --------------------------------------------------------------------------------------------
// mongo
const mongoURL = `mongodb://${MONGO_IP}:${MONGO_PORT}`;

const connectWithRetry = () => {
    console.log(mongoURL)
    mongoose
    // .connect('mongodb://rofung:A12345678@172.28.0.2:27017/?authSource=admin')
    // .connect('mongodb://rofung:A12345678@mongo:27017/?authSource=admin')
    .connect(mongoURL, {
        // auth: {
        //     authSource: "admin"
        // },
        user: MONGO_USER,
        pass: MONGO_PASSWORD,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // useFindAndModify: false,
    })
    .then(() => console.log("successfully connected to DB"))
    .catch((e) => {
        console.log(e)
        setTimeout(connectWithRetry, 5000)
    });
}

connectWithRetry();

// redis
// redis@v4
const { createClient } = require("redis")
let redisClient = createClient({ 
    url: `redis://${REDIS_URL}:${REDIS_PORT}`,
    legacyMode: true 
})
redisClient.connect().catch(console.error)

// --------------------------------------------------------------------------------------------
// middleware
// --------------------------------------------------------------------------------------------
app.enable("trust proxy");
app.use(express.json());
app.use(cors({}));
app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      saveUninitialized: false,
      secret: SESSION_SECRET,
      resave: false,
      cookie: {
        maxAge: 30000,
        httpOnly: true,
        secure: false
      }
    })
  )
// -------------------------------------------------------------------------------------------- 
// routes
// --------------------------------------------------------------------------------------------

const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");

// app.get('/api', (req, res) => {
//     res.send('Node-app is up and nodemon is watching!');
// })

app.get('/api', async (req, res) => {
    console.log(`I am sending a response ${os.hostname()}`)
    res.json({
        message: 'Node-app is up', hostname: os.hostname() 
    })
})

app.use('/api/v1/posts', postRouter);
app.use('/api/v1/users', userRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server on ${port}`);
});