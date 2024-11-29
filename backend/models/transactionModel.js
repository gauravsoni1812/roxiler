const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
    id: { type: Number, required: true },
    title: { type: String, required: true },
    price: { type: Number , required: true },
    description:{type: String, required:true},
    category:{type:String, required:true},
    image: {type:String, required:true},
    sold: {type:Boolean, required:true},
    dateOfSale:{type:String, required:true},
    month:{type:String}
});

exports.Transaction = mongoose.model('Transaction', transactionSchema);
 