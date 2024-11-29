const express = require('express');
const { fetchAndSaveData, fetchAllTransactions, saleAmountofMonth, totalSoldItemsOfMonth, totalNotSoldItemsOfMonth, priceRangeDataForMonth, categoryCountForMonth, combinedResult } = require('../controller/transactionController');

const router = express.Router();

router.get('/initdb',fetchAndSaveData);
router.get('/getAll',fetchAllTransactions)
router.get('/getTotalSales',saleAmountofMonth)
router.get('/getTotalcount',totalSoldItemsOfMonth)
router.get('/getTotalcountNot',totalNotSoldItemsOfMonth)
router.get('/barchart',priceRangeDataForMonth)
router.get('/categorycount',categoryCountForMonth)
router.get('/combined',combinedResult)
exports.router = router;  