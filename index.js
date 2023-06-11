const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lczeaqj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },

});



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const classCollection = client.db('singerx').collection('class')
    const instructorCollection = client.db('singerx').collection('instructor')
    const cartCollection = client.db('singerx').collection('cart')
    const usersCollection = client.db('singerx').collection('users')


    //   jwt function 
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '12h' })
      res.send({ token })
    })

    // all classes
    app.get('/classes', async (req, res) => {
      const cursor = classCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })


    // all instructors
    app.get('/instructors', async (req, res) => {
      const cursor = instructorCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.post('/carts', async (req, res) => {
      const item = req.body;
      const result = await cartCollection.insertOne(item);
      res.send(result);
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });


    //   single product
    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const options = {
        projection: { toyName: 1, photoUrl: 1, sellerName: 1, sellerEmail: 1, price: 1, rating: 1, availableQuantity: 1, detailDescription: 1 }
      }
      const result = await classCollection.findOne(query, options)
      res.send(result)
    })

    // post method on products
    app.post('/products', async (req, res) => {
      const product = req.body;
      const result = await classCollection.insertOne(product);
      res.send(result);
    })

    // update one product
    app.patch('/products/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedProduct = req.body;
      const product = {
        $set: {
          photoUrl: updatedProduct.photoUrl,
          toyName: updatedProduct.toyName,
          sellerName: updatedProduct.sellerName,
          sellerEmail: updatedProduct.sellerEmail,
          price: updatedProduct.price,
          rating: updatedProduct.rating,
          availableQuantity: updatedProduct.availableQuantity,
          detailDescription: updatedProduct.detailDescription,
          category: updatedProduct.category
        }
      }
      const result = await classCollection.updateOne(filter, product);
      res.send(result)
    })

    app.delete('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await classCollection.deleteOne(query);
      res.send(result);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //   await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running')
})

app.listen(port, () => {
  console.log(`My server is running on port ${port}`);
})