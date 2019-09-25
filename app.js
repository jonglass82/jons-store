const express = require('express');
const app = express();
const port = 3001;
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:3001';

// MongoClient.connect(url, function(err,db){
//   if(err){
//     console.log(err);
//   }
//   else{
//   console.log('database connected!');
//   db.close();
//   }
// });

app.use((request, response, next) => {
  response.header("Access-Control-Allow-Origin", "*"); 
  next(); 
});

app.get('/api/products', (req, res) => res.json(['blue shirt', "yellow shirt"]));

app.get('/api/product', function (req, res) {
  res.send("here is the product you wanted to see!");
  console.log("received your get request!");
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));