const express = require('express')
const cors = require('cors');
require('dotenv').config();
const SSLCommerzPayment = require('sslcommerz-lts')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

// middlewear
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yjrlok9.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false //true for live, false for 

// console.log(store_id, store_passwd);
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        /* Database and Collections:  */
        const userCollection = client.db('HungryHaste').collection('users');
        const shopCollection = client.db('HungryHaste').collection('shops');
        const foodCollection = client.db('HungryHaste').collection('foods');
        const cartCollection = client.db('HungryHaste').collection('carts');
        const orderCollection = client.db('HungryHaste').collection('orders');
        const reviewCollection = client.db('HungryHaste').collection('reviews');

        /* ==================== USER ==================== */
        // User Data Post
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const exitingUser = await userCollection.findOne(query);
            if (exitingUser) {
                return res.send({ message: 'user already exists' })
            }
            const result = await userCollection.insertOne(user);
            res.send(result)
        });

        // User Data Get
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

        // Delete Specific services
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });

        /* ==================== Shop ==================== */
        // Add a Shop
        app.post('/shops', async (req, res) => {
            const shops = req.body;
            const result = await shopCollection.insertOne(shops);
            res.send(result);
        });

        // Get Shops
        app.get('/shops', async (req, res) => {
            const result = await shopCollection.find().toArray();
            res.send(result);
        });

        // Get specific Shops
        app.get('/shops/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await shopCollection.findOne(query);
            res.send(result);
        });

        // Delete Specific shops
        app.delete('/shops/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await shopCollection.deleteOne(query);
            res.send(result);
        });

        // Approve the shops
        app.patch('/shops/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const shop = req.body;
            const updateDoc = {
                $set: {
                    status: true
                },
            };
            const result = await shopCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        /* ==================== Food ==================== */
        // Add a Food
        app.post('/foods', async (req, res) => {
            const foods = req.body;
            const result = await foodCollection.insertOne(foods);
            res.send(result);
        });

        // get all foods
        app.get('/foods', async (req, res) => {
            let category = req.query.category;
            let query = {};
            if (category) {
                query.category = category;
            }
            const cursor = foodCollection.find(query).sort({ food_name: 1 }).collation({ locale: "en", caseLevel: true });
            const result = await cursor.toArray();
            res.send(result);
        })

        // Delete Specific Foods
        app.delete('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.deleteOne(query);
            res.send(result);
        });

        // Get specific Foods
        app.get('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.findOne(query);
            res.send(result);
        });

        // Edit Specific Foods
        app.put('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedFoods = req.body;
            const foods = {
                $set: {
                    food_name: updatedFoods.food_name,
                    price: updatedFoods.price,
                    category: updatedFoods.category,
                    image: updatedFoods.image,
                    volume: updatedFoods.volume,
                },
            }
            const result = await foodCollection.updateOne(filter, foods, options)
            res.send(result);
        });

        /* ==================== CART ==================== */
        // Add a cart
        app.post('/carts', async (req, res) => {
            const carts = req.body;
            const query = { food_name: carts.food_name, customer_email: carts.customer_email }
            const exitingCarts = await cartCollection.findOne(query);
            if (exitingCarts) {
                return res.send({ message: 'Product already in cart' })
            }
            const result = await cartCollection.insertOne(carts);
            res.send(result);
        });

        // Get Carts
        app.get('/carts', async (req, res) => {
            const result = await cartCollection.find().toArray();
            res.send(result);
        });

        // get specific Carts
        app.get('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.findOne(query);
            res.send(result);
        })

        // Add total price
        app.patch('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateCart = req.body;
            const updateDoc = {
                $set: {
                    totalPrice: updateCart.totalPrice,
                    quantity: updateCart.quantity,
                },
            };
            const result = await cartCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        // Delete Specific shops
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        });

        /* ==================== Payment - Food ==================== */
        const trans_id = new ObjectId().toString();
        // Add a Payment
        app.post('/orders', async (req, res) => {
            const orders = req.body;
            const food = await cartCollection.findOne({ _id: new ObjectId(orders.foodId) })
            const data = {
                total_amount: food?.totalPrice,
                currency: 'BDT',
                tran_id: trans_id, // use unique tran_id for each api call
                success_url: `http://localhost:5000/profile/payment/success/${trans_id}`,
                fail_url: 'http://localhost:3030/fail',
                cancel_url: 'http://localhost:3030/cancel',
                ipn_url: 'http://localhost:3030/ipn',
                shipping_method: 'Courier',
                product_name: orders.food_name,
                product_category: orders.category,
                product_profile: 'general',
                cus_name: orders.customer_name,
                cus_email: orders.customer_email,
                cus_add1: orders.address,
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: orders.telephone,
                cus_fax: '01711111111',
                ship_name: orders.customer_name,
                ship_add1: orders.address,
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
            };

            console.log(data);
            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
            sslcz.init(data).then(apiResponse => {
                // Redirect the user to payment gateway
                let GatewayPageURL = apiResponse.GatewayPageURL
                res.send({ url: GatewayPageURL });

                const finalOrder = {
                    food,
                    address: orders.address,
                    telephone: orders.telephone,
                    paidStatus: false,
                    transactionId: trans_id
                }
                const result = orderCollection.insertOne(finalOrder);

                console.log('Redirecting to: ', GatewayPageURL)
            });

            app.post("/profile/payment/success/:tranId", async (req, res) => {
                console.log(req.params.tranId);
                const result = await orderCollection.updateOne({ transactionId: req.params.tranId }, {
                    $set: {
                        paidStatus: true,
                    }
                })

                if (result.modifiedCount > 0) {
                    res.redirect(`http://localhost:5173/profile/payment/success/${req.params.tranId}`)
                }
            })
        });

        // Get Orders with the latest one first
        app.get('/orders', async (req, res) => {
            try {
                // Find all orders, sort by _id in descending order
                const result = await orderCollection.find().sort({ _id: -1 }).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // Delete Specific shops
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        /* ==================== Review ==================== */
        // Add a Review
        app.post('/reviews', async (req, res) => {
            const reviews = req.body;
            const query = { foodId: reviews.foodId, email: reviews.email }
            const exitingReview = await reviewCollection.findOne(query);
            if (exitingReview) {
                return res.send({ message: 'Product already reviewed' })
            }
            const result = await reviewCollection.insertOne(reviews);
            res.send(result);
        });

        // Get reviews
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        });



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Welcome to Hungry Haste Server!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})