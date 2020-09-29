const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xg9za.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 5000




app.use(cors());
app.use(bodyParser.json());


const serviceAccount = require("./config/burj-al-arabb-firebase-adminsdk-pol2j-abf66199ee.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");
    console.log("db connected successfully");

    app.post("/addBooking", (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0);
            })       
    })

    app.get("/bookings", (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith("Bearer ")) {
            const idToken = bearer.split(" ")[1];            
            admin.auth().verifyIdToken(idToken)
                .then(function (decodeToken) {
                    let tokenEmail = decodeToken.email;
                    if (tokenEmail == req.query.email) {
                        bookings.find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    } else {
                        res.status(401).send('un-authorized access');
                    }
                })
                .catch(function (err) {
                    res.status(401).send('un-authorized access');
                });
        }
        else{
            res.status(401).send('un-authorized access');
        }
    })
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})