const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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

        app.get('/users', async (req, res) => {
            const query = {};
            const user = await usersCollection.find(query).toArray();
            res.send(user)
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

        app.post('/advertisProducts', async (req, res) => {
            const advProduct = req.body;
            const result = await advertisesCollection.insertOne(advProduct);
            res.send(result);
        });

        app.get('/advertisProducts', async (req, res) => {
            const query = {}; 
            const result = await advertisesCollection.find(query).toArray();
            res.send(result);
        });

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
