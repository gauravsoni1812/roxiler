const axios = require('axios');
const { Transaction } = require("../models/transactionModel")
const moment = require('moment');

// Mapping month numbers to month names
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

exports.fetchAndSaveData = async (req, res) => {
    try {
        // Fetching data from the given URL
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const productData = response.data;

        // Function to extract the month name (e.g., "January", "February", etc.)
        const getMonthFromDate = (dateStr) => {
            // Using moment.js to easily extract the month and map to month name
            const monthIndex = moment(dateStr).month(); // Moment's month() gives 0-11 (0 = January, 1 = February, etc.)
            return monthNames[monthIndex];  // Mapping numeric index to month name
        };

        // Create an array of Transaction model instances from the fetched data
        const transactions = productData.map(item => ({
            id: item.id,
            title: item.title,
            price: item.price,
            description: item.description,
            category: item.category,
            image: item.image,
            sold: item.sold,
            dateOfSale: item.dateOfSale,
            month: getMonthFromDate(item.dateOfSale) // Add the month field as a string (e.g., "January")
        }));

        // Check if the transactions already exist in the database based on their id
        const existingTransactions = await Transaction.find({ id: { $in: transactions.map(t => t.id) } });

        // Extract the ids of the existing transactions in the database
        const existingTransactionIds = existingTransactions.map(transaction => transaction.id);

        // Filter out the transactions that already exist in the database
        const newTransactions = transactions.filter(transaction => !existingTransactionIds.includes(transaction.id));

        // If there are new transactions, insert them into the MongoDB database
        if (newTransactions.length > 0) {
            await Transaction.insertMany(newTransactions);
            res.send(`Inserted ${newTransactions.length} new transactions.`);
        } else {
            res.send("No new transactions to insert.");
        }

    } catch (error) {
        console.error("Error fetching or saving data:", error);
        throw error; // Rethrow error for handling in route
    }
};

exports.fetchAllTransactions = async (req, res) => {
    const searchQuery = req.query.search || ""; // Get search query from request
    let query = Transaction.find({});
    let totalDocs;

    try {
        // Apply search filter if 'search' is provided in the request
        if (searchQuery) {
            console.log("Raw Search Query:", searchQuery);

            const escapedQuery = escapeRegex(searchQuery.trim()); // Escape special characters
            const searchFilter = { title: { $regex: escapedQuery, $options: "i" } }; // Case-insensitive regex match
            console.log("Search Filter:", searchFilter);

            query = query.find(searchFilter); // Apply search filter
            totalDocs = await Transaction.countDocuments(searchFilter); // Count matching documents
        } else {
            totalDocs = await Transaction.countDocuments(); // Count all documents if no search query
        }

        // Handle pagination if 'page' and 'limit' are provided in the request
        if (req.query.page && req.query.limit) {
            const pageSize = parseInt(req.query.limit, 10);
            const page = parseInt(req.query.page, 10);
            query = query
                .sort({ id: 1 }) // Ascending order of id
                .skip((page - 1) * pageSize)
                .limit(pageSize);
        }

        console.log("Query Filter (before execution):", query.getFilter());

        const response = await query.exec(); // Execute query
        console.log("Query Results:", response);

        // Return the response along with the total count of documents
        const data = {
            transactions: response,
            totalItems: totalDocs,
        };

        res.set("X-Total-Count", totalDocs);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error:", error.message);
        res.status(400).json({ error: error.message });
    }
};

// Helper Function to Escape Special Regex Characters
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape special regex characters
}


exports.saleAmountofMonth = async (req, res) => {
    let month = req.query.month;

    try {
        // MongoDB aggregation to calculate the total price for a given month
        const result = await Transaction.aggregate([
            {
                $match: { month: month } // Filter documents by the provided month
            },
            {
                $group: {
                    _id: null, // No grouping by field, just calculate the total
                    totalSaleAmount: { $sum: "$price" } // Sum the 'price' field
                }
            }
        ]);

        // Check if the result is empty (no matching documents)
        if (result.length === 0) {
            return res.status(200).json({ totalSaleAmount: 0 }); // If no transactions for the month, return 0
        }

        // Extract the totalSaleAmount from the aggregation result
        const totalSaleAmount = result[0].totalSaleAmount;

        // Return the total sale amount in the response
        res.status(200).json({ totalSaleAmount });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error.message }); // Return error if there's an issue
    }
};


exports.totalSoldItemsOfMonth = async (req, res) => {
    let month = req.query.month;

    try {
        // MongoDB aggregation to count the number of sold items for a given month
        const result = await Transaction.aggregate([
            {
                $match: {
                    month: month, // Match the transactions for the given month
                    sold: true     // Filter by sold items (those with sold: true)
                }
            },
            {
                $count: "totalSoldItems" // Count the number of matching transactions
            }
        ]);

        // Check if no transactions matched the criteria
        if (result.length === 0) {
            return res.status(200).json({ totalSoldItems: 0 }); // If no sold items, return 0
        }

        // Extract the totalSoldItems count from the aggregation result
        const totalSoldItems = result[0].totalSoldItems;

        // Return the total number of sold items
        res.status(200).json({ totalSoldItems });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error.message }); // Return error if something goes wrong
    }
};

exports.totalNotSoldItemsOfMonth = async (req, res) => {
    let month = req.query.month;
    try {
        // MongoDB aggregation to count the number of sold items for a given month
        const result = await Transaction.aggregate([
            {
                $match: {
                    month: month, // Match the transactions for the given month
                    sold: false     // Filter by sold items (those with sold: true)
                }
            },
            {
                $count: "totalSoldItems" // Count the number of matching transactions
            }
        ]);

        // Check if no transactions matched the criteria
        if (result.length === 0) {
            return res.status(200).json({ totalSoldItems: 0 }); // If no sold items, return 0
        }

        // Extract the totalSoldItems count from the aggregation result
        const totalNotSoldItems = result[0].totalSoldItems;

        // Return the total number of sold items
        res.status(200).json({ totalNotSoldItems });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error.message }); // Return error if something goes wrong
    }
};

exports.priceRangeDataForMonth = async (req, res) => {
    let month = req.query.month;

    try {
        // MongoDB aggregation pipeline
        const result = await Transaction.aggregate([
            // Match documents for the selected month, regardless of the year
            {
                $match: {
                    month: month, // Match the month
                    sold: true     // Only consider sold items
                }
            },
            // Add a field that categorizes the price into the desired range
            {
                $addFields: {
                    priceRange: {
                        $switch: {
                            branches: [
                                { case: { $lte: ["$price", 100] }, then: "0-100" },
                                { case: { $lte: ["$price", 200] }, then: "101-200" },
                                { case: { $lte: ["$price", 300] }, then: "201-300" },
                                { case: { $lte: ["$price", 400] }, then: "301-400" },
                                { case: { $lte: ["$price", 500] }, then: "401-500" },
                                { case: { $lte: ["$price", 600] }, then: "501-600" },
                                { case: { $lte: ["$price", 700] }, then: "601-700" },
                                { case: { $lte: ["$price", 800] }, then: "701-800" },
                                { case: { $lte: ["$price", 900] }, then: "801-900" },
                                { case: { $gt: ["$price", 900] }, then: "901-above" }
                            ],
                            default: "Unknown"
                        }
                    }
                }
            },
            // Group by priceRange and count the number of items in each range
            {
                $group: {
                    _id: "$priceRange", // Group by price range
                    count: { $sum: 1 }   // Count the number of items in each range
                }
            },
            // Sort by the defined price range order
            {
                $sort: {
                    _id: 1 // Sort by price range (from 0-100 to 901-above)
                }
            }
        ]);

        // Format the result in a way that's suitable for the bar chart
        const priceRanges = [
            "0-100", "101-200", "201-300", "301-400", "401-500",
            "501-600", "601-700", "701-800", "801-900", "901-above"
        ];

        // Initialize the result array with zero counts
        const formattedResult = priceRanges.map(range => {
            const rangeData = result.find(item => item._id === range);
            return { priceRange: range, count: rangeData ? rangeData.count : 0 };
        });

        // Return the response in the format required for a bar chart
        res.status(200).json({ data: formattedResult });

    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error.message }); // Return error if something goes wrong
    }
};

exports.categoryCountForMonth = async (req, res) => {
    let month = req.query.month;

    try {
        // MongoDB aggregation pipeline
        const result = await Transaction.aggregate([
            // Match documents for the selected month, regardless of the year
            {
                $match: {
                    month: month, // Match the month
                    sold: true     // Only consider sold items
                }
            },
            // Group by category and count the number of items in each category
            {
                $group: {
                    _id: "$category",  // Group by the 'category' field
                    count: { $sum: 1 } // Count the number of items in each category
                }
            },
            // Sort by the count of items in descending order (optional)
            {
                $sort: { count: -1 }
            }
        ]);

        // Format the result for pie chart
        const formattedResult = result.map(item => ({
            category: item._id,
            count: item.count
        }));

        // Return the response in the required format for a pie chart
        res.status(200).json({ data: formattedResult });

    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error.message }); // Return error if something goes wrong
    }
};

exports.combinedResult = async (req, res) => {
    let month = req.query.month;
    let data = {};

    try {
        // MongoDB aggregation pipeline
        const result = await Transaction.aggregate([
            // Match documents for the selected month, regardless of the year
            {
                $match: {
                    month: month, // Match the month
                    sold: true     // Only consider sold items
                }
            },
            // Add a field that categorizes the price into the desired range
            {
                $addFields: {
                    priceRange: {
                        $switch: {
                            branches: [
                                { case: { $lte: ["$price", 100] }, then: "0-100" },
                                { case: { $lte: ["$price", 200] }, then: "101-200" },
                                { case: { $lte: ["$price", 300] }, then: "201-300" },
                                { case: { $lte: ["$price", 400] }, then: "301-400" },
                                { case: { $lte: ["$price", 500] }, then: "401-500" },
                                { case: { $lte: ["$price", 600] }, then: "501-600" },
                                { case: { $lte: ["$price", 700] }, then: "601-700" },
                                { case: { $lte: ["$price", 800] }, then: "701-800" },
                                { case: { $lte: ["$price", 900] }, then: "801-900" },
                                { case: { $gt: ["$price", 900] }, then: "901-above" }
                            ],
                            default: "Unknown"
                        }
                    }
                }
            },
            // Group by priceRange and count the number of items in each range
            {
                $group: {
                    _id: "$priceRange", // Group by price range
                    count: { $sum: 1 }   // Count the number of items in each range
                }
            },
            // Sort by the defined price range order
            {
                $sort: {
                    _id: 1 // Sort by price range (from 0-100 to 901-above)
                }
            }
        ]);

        // Format the result in a way that's suitable for the bar chart
        const priceRanges = [
            "0-100", "101-200", "201-300", "301-400", "401-500",
            "501-600", "601-700", "701-800", "801-900", "901-above"
        ];

        // Initialize the result array with zero counts
        const formattedResult = priceRanges.map(range => {
            const rangeData = result.find(item => item._id === range);
            return { priceRange: range, count: rangeData ? rangeData.count : 0 };
        });

        // Return the response in the format required for a bar chart
        // res.status(200).json({ data: formattedResult });
        data.range = formattedResult;

    } catch (error) {
        console.log(error);
        // res.status(500).send({ error: error.message }); // Return error if something goes wrong
    }



    try {
        // MongoDB aggregation pipeline
        const result = await Transaction.aggregate([
            // Match documents for the selected month, regardless of the year
            {
                $match: {
                    month: month, // Match the month
                    sold: true     // Only consider sold items
                }
            },
            // Group by category and count the number of items in each category
            {
                $group: {
                    _id: "$category",  // Group by the 'category' field
                    count: { $sum: 1 } // Count the number of items in each category
                }
            },
            // Sort by the count of items in descending order (optional)
            {
                $sort: { count: -1 }
            }
        ]);

        // Format the result for pie chart
        const formattedResult = result.map(item => ({
            category: item._id,
            count: item.count
        }));

        // Return the response in the required format for a pie chart
        data.categories = formattedResult
        // res.status(200).json({ data: formattedResult });

    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error.message }); // Return error if something goes wrong
    }
    res.status(200).json({ data })
}