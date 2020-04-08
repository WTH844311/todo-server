const mongoose = require('mongoose')

const Schema = mongoose.Schema
const UserSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true
    },
    last_login_at: String,
    password_updated_at: String,
    created_at: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    country: String,
    birthYear: Number,
    birthMonth: Number,
    birthDay: Number,
    sex: Number,
    postalCode: Number,
    timezoom: String
}, { collection: 'user', versionKey: false })

module.exports = mongoose.model('user', UserSchema)