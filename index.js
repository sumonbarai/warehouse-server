const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

// middleware
app.use(cors());
app.use(express.json());
function verifyjwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ASSESS_TOKEN_SECRECT, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden assess" });
    }
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.spgtn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const productCollection = client
      .db("productCollection")
      .collection("product");

    // jwt login  token create
    app.post("/login", async (req, res) => {
      const email = req.body;
      const assess_token = jwt.sign(email, process.env.ASSESS_TOKEN_SECRECT, {
        expiresIn: "1d",
      });
      res.send({ assess_token });
    });

    // all product get api
    app.get("/product", async (req, res) => {
      const total = parseFloat(req.query.total);
      const query = {};
      const cursor = productCollection.find(query);
      let products;
      if (total) {
        products = await cursor.limit(total).toArray();
      } else {
        products = await cursor.toArray();
      }
      res.send(products);
    });
    // product get search by email address
    app.get("/productEmail", verifyjwt, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      const query = { email: email };
      if (email === decodedEmail) {
        const cursor = productCollection.find(query);
        const product = await cursor.toArray();
        res.send(product);
      } else {
        res.status(403).send({ message: "forbidden assess" });
      }
    });
    // product get by id
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });
    // product update by search query
    app.put("/product/", async (req, res) => {
      const id = req.query.id;
      const quantity = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          quantity: quantity.quantity,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // product quantity increase
    app.put("/productIncrease/", async (req, res) => {
      const id = req.query.id;
      const quantity = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          quantity: quantity.quantity,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // database product insert by post method
    app.post("/product", async (req, res) => {
      const data = req.body;
      const result = await productCollection.insertOne(data);
      res.send(result);
    });
    // database product delete by delete method
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// basic server set code
app.get("/", (req, res) => {
  res.send("successfully server run");
});

app.listen(port, () => {
  console.log(`my server is running ${port}`);
});
