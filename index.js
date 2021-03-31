const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;

require('dotenv').config()
// console.log(process.env.DB_USER)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.73puo.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const port = 5000;

var serviceAccount = require("./configs/burj-al-arab-7afbd-firebase-adminsdk-9ngt0-3cc452556a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  console.log(err)
  const bookings = client.db("burjAlArab").collection("bookings");
  console.log('connection to db successful')
  //get booking data from post method API
  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
    .then(result => {
      res.send(result.insertedCount > 0)
    })
  })
  //read booking data API
  app.get('/bookings', (req, res) => {
    // console.log(req.query.email);
    // console.log(req.headers.authorization);
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      console.log({idToken})

      admin
      .auth()
      .verifyIdToken(idToken)
      .then((decodedToken) => {
        // const uid = decodedToken.uid;
        const tokenEmail = decodedToken.email;
        const queryEmail = req.query.email;
        console.log(tokenEmail, queryEmail);
        if (tokenEmail === queryEmail) {
          bookings.find({email: queryEmail})
          .toArray((err, documents) => {
            res.status(200).send(documents);
          })
        }
        // console.log({uid});
        else {
          res.status(401).send('Un-authorized access');
        }
      })
      .catch((error) => {
        res.status(401).send('Un-authorized access');
      });
    }
    else {
      res.status(401).send('Un-authorized access');
    }
  })
});

app.listen(port, () => {
  console.log(`burj-al-arab listening at http://localhost:${port}`)
})