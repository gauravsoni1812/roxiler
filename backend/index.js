const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const { Transaction } = require('./models/transactionModel'); // Adjust the path to your model
const transactionRouter = require("./routes/route")
const server = express();
const cors = require("cors") 
server.use(express.json()); // To parse JSON request body
// Function to fetch data and initialize the database
server.use(cors("*"))
server.use("/",transactionRouter.router)

mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log("Connected to MongoDB");
        server.listen(3000, () => {    
            console.log("Server is running on port 3000"); 
        });
    })
    .catch(err => {
        console.error("Error connecting to MongoDB", err);
    });