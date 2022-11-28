const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
console.log(process.env.STRIPE_SECRET_KEY)

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.myxtuht.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run(){
    try{
        const categoriesCollection = client.db('mobileMarket').collection('categories');
        const usersCollection = client.db('mobileMarket').collection('users');
        const productsCollection = client.db('mobileMarket').collection('products');
        const ordersCollection = client.db('mobileMarket').collection('orders');
        const advertisesCollection = client.db('mobileMarket').collection('advertises');
        const paymentsCollection = client.db('mobileMarket').collection('payment');
        
        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        })
        app.get('/adproducts', async (req, res) => {
            const query = {};
            const result = await advertisesCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await ordersCollection.findOne(query);
            res.send(booking);
        })

        app.get('/users', async (req, res) => {
            let query = {};
            if(req.query.userstatus){
                query = {
                    userstatus: req.query.userstatus
                }
            }
            const user = await usersCollection.find(query).toArray();
            res.send(user)
        })

        app.get('/user-verify', async( req, res) => {
            const email = req.query.sellerEmail;
            const query = {email: email}
            const user = await usersCollection.findOne(query);
            let result = false;
            if(user?.status === 'verified'){
                result =  true;
            }
            res.send({result})

        })

        app.put('/users/admin/:id', async(req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const options = { upsert: true}
            const updatedDoc = {
                $set: {
                    status: 'verified'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })

        // app.put('/orders-update', async(req, res) => {
        //     const id = req.body.order;
        //     const filter = {_id: ObjectId(id)}
        //     const options = { upsert: true}
        //     const updatedDoc = {
        //         $set: {
        //             status: 'verified'
        //         }
        //     }
        //     const result = await ordersCollection.updateOne(filter, updatedDoc, options);
        //     const ids = req.body.bookingsId;
        //     const product = await productsCollection.updateOne(({_id: ObjectId(ids)}), updatedDoc, options )
        //     res.send(result)
        // })

        // app.post('/orders-update', async(req, res) => {
        //     const payment = req.body;
        //     const result = await ordersCollection.insertOne(payment);
        //     const id = payment.bookingId
        //     const filter = {_id: ObjectId(id)}
        //     const updatedDoc = {
        //         $set: {
        //             paid: true,
        //             transactionId: payment.transactionId
        //         }
        //     }
        //     const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
        //     res.send(result);
        // })

        app.put('/seller/myproducts/:id', async(req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const options = { upsert: true}
            const updatedDoc = {
                $set: {
                    advertise:'true'
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })



        app.delete('/seller/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id:ObjectId(id)}
            const result = await usersCollection.deleteOne(query)
            console.log(result)
            res.send(result)
        })

       

        app.get('/products', async (req, res) => {  
            console.log(req.query)          
            let query = {};
            if(req.query.categoryName){
                query = {
                    categoryName: req.query.categoryName
                }

            }
            const cursor = productsCollection.find(query)
            const products = await cursor.toArray();
            res.send(products)
        })
        // app.get('/sold-products', async (req, res) => {  
        //     console.log(req.query)          
        //     let query = {};
        //     if(req.query.sold){
        //         query = {
        //             sold: true
        //         }
        //     }
        //     const cursor = productsCollection.find(query)
        //     const products = await cursor.toArray();
        //     res.send(products)
        // })


        app.get('/products', async (req, res) => {  
            console.log(req.query)          
            let query = {};
            if(req.query.categoryName && req.query.sold){
                query = {
                    categoryName: req.query.categoryName,
                    sold: true
                }
            }
            const cursor = productsCollection.find(query)
            const products = await cursor.toArray();
            res.send(products)
        })

        app.get('/sellePproducts', async (req, res) => {  
            console.log(req.body)          
            let query = {};
            if(req.query.sellerName){
                query = {
                    sellerName: req.query.sellerName
                }
            }
            const cursor = productsCollection.find(query)
            const products = await cursor.toArray();
            // const products = await productsCollection.find(query).toArray();
            res.send(products)
        })


        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });



        app.get('/jwt', async(req, res) =>{
            const email = req.query.email;
            const query = {email:email};
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });

        app.post('/create-payment-intent', async(req, res) => {
            const order = req.body;
            const price = order.resalePrice;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.order;
            console.log(id);
            const filter = {_id: ObjectId(id)}
            const updatedDoc = {
                $set: {
                    paid: true,
                    // transactionId: payment.transactionId
                }
            }
            const updatedResult = await ordersCollection.updateOne(filter, updatedDoc)

            const ids = payment.bookingsId
            const mfilter = {_id: ObjectId(ids)}
            const updatedDocs = {
                $set: {
                    sold: true,
                }
            }
            const updatesResult = await productsCollection.updateOne(mfilter, updatedDocs)

            res.send(result);
        })



        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.userstatus === 'seller' });
        })
        
        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.userstatus === 'buyer' });
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.userstatus === 'admin' });
        })
        
        
        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.get('/orders', async (req, res) => {
            let query = {};
            if(req.query.email){
                query = {
                    email: req.query.email
                }
            }
            const order = await ordersCollection.find(query).toArray();
            res.send(order)
        })

        app.post('/orders', async(req, res) => {
            const order = req.body;
            const query = {
                productName: order.productName
            }
            const alreadyBooked = await ordersCollection.find(query).toArray();
            if(alreadyBooked.length){
                const message = `You already have a booking on ${order.productName}`
                return res.send({acknowledged: false, message})
            }
            const result = await ordersCollection.insertOne(order);
            res.send(result)
        })

        app.get('/advertisProducts', async (req, res) => {
            // const adproduct = req.query.advertise;
            // const query = { adproduct : adproduct }
            let query = {};
            if(req.query.advertise){
                    query = {
                        advertise: req.query.advertise
                    }
                }
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        });

        // app.get('/users', async (req, res) => {
        //     let query = {};
        //     if(req.query.userstatus){
        //         query = {
        //             userstatus: req.query.userstatus
        //         }
        //     }
        //     const user = await usersCollection.find(query).toArray();
        //     res.send(user)
        // })

        // app.get('/user-verify', async( req, res) => {
        //     const email = req.query.sellerEmail;
        //     const query = {email: email}
        //     const user = await usersCollection.findOne(query);
        //     let result = false;
        //     if(user?.status === 'verified'){
        //         result =  true;
        //     }
        //     res.send({result})

        // })



        // app.get('/advertisProducts', async (req, res) => {
        //     const query = {}; 
        //     const result = await advertisesCollection.find(query).toArray();
        //     res.send(result);
        // });

        app.delete('/sellePproducts/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id:ObjectId(id)}
            const result = await productsCollection.deleteOne(query)
            console.log(result)
            res.send(result)
        })

    }
    finally{

    }
}
run().catch(console.log)

app.get('/', async (req, res) => {
    res.send('Mobile Market running ');
})

app.listen(port, () => console.log(`Mobile Market running on ${port}`))
