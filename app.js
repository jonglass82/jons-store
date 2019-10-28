const express = require('express');
var cors = require('cors');
const app = express();
const bodyParser  = require('body-parser');
const port = 3001;
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const url = `mongodb+srv://jonglass:${process.env.MONGO_DB_PASSWORD}@cluster0-w4qcc.mongodb.net/jonsStore?retryWrites=true&w=majority`;


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


let mongoDb;

MongoClient.connect(url, function(err,db){
  if (err){
    console.log(err);
  } else {
  console.log('database connected!');
  mongoDb = db.db('jonsStore');
  // db.close();
  }
});

app.use(cors());

app.get('/api/products', async (req,res) => {
  const products = await mongoDb.collection('products').find().toArray();
  res.json(products)
});

app.post('/api/create', cors(), (req,res) => {
  console.log(req.body);
  // const products = await mongoDb.collection('products');
  // products.insertOne({title: req.body.title, description: req.body.description, price: req.body.price});
})

app.post('/api/login', (req,res) => {
  console.log("hit the login route!");
  // console.log(req.data);
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));