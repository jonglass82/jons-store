const express = require('express');
var cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const bodyParser  = require('body-parser');
const ObjectId = require('mongodb').ObjectID;
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



app.post('/api/create', cors(), async (req,res) => {
  console.log(req.body);

  const legit = jwt.verify(req.body.auth, process.env.SECRET_KEY);

  if (legit){

  const products = await mongoDb.collection('products');

  products.insertOne({title: req.body.title, description: req.body.description, price: req.body.price});
  }
  else{
    res.send("You do not have access!!!")
  }

})


app.post('/api/login', async (req,res) => {

  const user = await mongoDb.collection('user').findOne({
    email: req.body.email,
    password: req.body.password
  });

  if (user){
    const token = jwt.sign({
      id: user._id
    }, process.env.SECRET_KEY)

    res.json({ authenticated: true, token: token })
  }
  else{
    res.send("invalid login");
  }
})


app.put('/api/update/:id', async (req,res) => {

  const product = await mongoDb.collection('products').findOne({
    _id : ObjectId(req.params.id)
  })

  if (product){
    mongoDb.collection('products').updateOne(
      {_id: ObjectId(req.params.id)}, 
      { $set: { 
        title: req.body.newTitle, 
        description: req.body.newDescription, 
        price: req.body.newPrice 
      } }
    );

    console.log(req.body)
  }
  else{
    console.log("no product found ... ")
  }

})


app.listen(port, () => console.log(`Example app listening on port ${port}!`));