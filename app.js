const express = require('express');
const cors = require('cors');
const app = express();
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const bodyParser  = require('body-parser');
const ObjectId = require('mongodb').ObjectID;
const port = 3001;
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const url = `mongodb+srv://jonglass:${process.env.MONGO_DB_PASSWORD}@cluster0-w4qcc.mongodb.net/jonsStore?retryWrites=true&w=majority`;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

cloudinary.config({ 
  cloud_name: '${process.env.CLOUD_NAME}', 
  api_key: '${process.env.CLOUDINARY_KEY}', 
  api_secret: '${process.env.CLOUDINARY_SECRET}' 
});

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

  const legit = jwt.verify(req.body.auth, process.env.SECRET_KEY);

  if (legit){

      const products = await mongoDb.collection('products');

      products.insertOne({
        title: req.body.title, 
        description: req.body.description, 
        price: req.body.price,
        shipping: req.body.shipping,
        sold: req.body.sold,
        available: req.body.available,
        category: req.body.category, 
        images: req.body.images
      });
      console.log("your product has been created!")
    }

  else{
    res.send("You do not have access!!!")
  }

});


app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: '100',
    currency: "usd"
  });
  res.send({
    clientSecret: paymentIntent.client_secret
  });
});



app.post('/make-payment', async (req, res) => {

  console.log('here is the request body: ',req);

    // const token = request.body.stripeToken;

    // const charge = await stripe.charges.create({
    //   amount: 999,
    //   currency: 'usd',
    //   description: 'Example charge',
    //   source: token,
    // });

    // if (charge) {
      // res.send('Payment SUCCESSFULL');
      // res.json({payment_confirmation: charge})
    // }
    // else{
    //   res.send()
    // }

});


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
    res.send("Your product has been updated!");
  }
  else{
    res.send("no product found ... ");
  }

})


app.listen(port, () => console.log(`Example app listening on port ${port}!`));