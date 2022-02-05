const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const placeSchema = new Schema({
    title: { type: String, required: true},
    description: { type: String, required: true},
    image: { type: String, required: true}, // URL String for the image. DOn't store image on the db because it may slow down
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    address: { type: String, required: true},
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User'}, // ref creates relationship between Places and Users
});

module.exports = mongoose.model('Place', placeSchema);