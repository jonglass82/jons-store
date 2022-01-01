const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const bodyParser  = require('body-parser');
const ObjectId = require('mongodb').ObjectID;
const port = process.env.PORT || 5000;
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const url = `mongodb+srv://jonglass:${process.env.MONGO_DB_PASSWORD}@cluster0-w4qcc.mongodb.net/jonsStore?retryWrites=true&w=majority&useNewUrlParser=true`;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

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

app.get('/api/collectibles', async (req,res) => {
  const collectibles = await mongoDb.collection('Collectibles').find().toArray();
  res.json(collectibles)
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
    }

  else{
    res.send("You do not have access!!!")
  }

});

app.post("/api/check-carted-items", async (req, res) => {

  //check if items in customer's cart have already been sold
  const { cartedItems } = req.body;
  const itemsNotFound = [];
  const products = await mongoDb.collection('products').find().toArray();

    cartedItems.forEach((cartedItem)=>{

        let foundCount = 0;

        products.forEach((product)=>{
          if(cartedItem._id == product._id && product.available == 'yes'){
            foundCount ++;
            return;
          }
        });

        if(foundCount == 0){
          itemsNotFound.push(cartedItem);
        }
    });

    if(itemsNotFound.length > 0){
      res.json({status: false, itemsNotFound: itemsNotFound});
    }
    else{
      res.json({status: true});
    }

});

app.post('/api/create-order', async (req,res) => {

  //proceed with creating the order
  const legit = (req.body.auth == process.env.EXHIBITB);

  if (legit){

      const orders = await mongoDb.collection('orders');
      const products = await mongoDb.collection('products').find().toArray();

      //Insert the order
      if(orders){
        orders.insertOne({
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zip: req.body.zip,
          message: req.body.message,
          items: req.body.items,
          total: req.body.total,
          paymentDetails: req.body.paymentDetails
        });
      }

      //Send text message to me
      client.messages.create({
         body: 'YOU GOT A SALE !!!',
         from: process.env.TWILIO_NUMBER,
         to: process.env.JONS_NUMBER
      }).then(message => console.log(message)).catch(err => console.log(err));

      //Send email to me
      const msgToMe = {
        to: 'jonglass82@gmail.com',
        from: 'jonglasswebsite@gmail.com',
        subject: 'Order Received',
        text: 'Order details:',
        html: `<div><strong>Order details:</strong>
          <ul>
            <li>Name: ${req.body.name}</li>
            <li>Email: ${req.body.email}</li>
            <li>Phone: ${req.body.phone}</li>
            <li>Address: ${req.body.address}</li>
            <li>City: ${req.body.city}</li>
            <li>Zip: ${req.body.zip}</li>
            <li>Message: ${req.body.message}</li>
            <li>Items: ${req.body.items}</li>
            <li>Order total: ${req.body.total}</li>
          </ul>
          </div>`,
      }

      sgMail
        .send(msgToMe)
        .then((response) => {
          console.log(response[0].statusCode)
          console.log(response[0].headers)
        })
        .catch((error) => {
          console.error(error)
        })

      //Send email to the buyer
      const msgToCustomer = {
        to: req.body.email,
        from: 'jonglasswebsite@gmail.com',
        subject: 'Thank you for your purchase',
        text: 'Thank you so much for your purchase from www.jon-glass.com',
        html: '<div><strong>Order details:</strong><p>Your order will be processed within 24 hours. I will follow up with you at the contact information you provided and provide tracking information.</p><p>Thanks again!</p><p>- Jon Glass</p></div>',
      }

      sgMail
        .send(msgToCustomer)
        .then((response) => {
          console.log(response[0].statusCode)
          console.log(response[0].headers)
        })
        .catch((error) => {
          console.error(error)
        })

      //Set the item to sold
      if (products){
        req.body.items.forEach((item)=>{
            mongoDb.collection('products').updateOne(
              {_id: ObjectId(item._id)}, 
              { $set: { 
                sold: 'yes', 
                available: 'no'
              } }
            );
        });
      }

      //Send a success response to the client
      res.send("Order successfully placed");

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
    res.send("Your product has been updated!");
  }
  else{
    res.send("no product found ... ");
  }

})


app.listen(port, () => console.log(`Example app listening on port ${port}!`));