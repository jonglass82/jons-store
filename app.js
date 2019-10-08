const express = require('express');
const app = express();
const port = 3001;
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const url = `mongodb+srv://jonglass:${process.env.MONGO_DB_PASSWORD}@cluster0-w4qcc.mongodb.net/jonsStore?retryWrites=true&w=majority`;

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

app.use((request, response, next) => {
  response.header("Access-Control-Allow-Origin", "*"); 
  next(); 
});

app.get('/api/products', async (req,res) => {
  const products = await mongoDb.collection('products').find().toArray();
  console.log(products)
  res.json(products)
});


app.get('/api/product', function (req, res) {
  res.send("here is the product you wanted to see!");
  console.log("received your get request!");
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));