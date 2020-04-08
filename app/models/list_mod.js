const mongoose = require('mongoose')

const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const ListSchema = new Schema({
    title: String,
    local_id: ObjectId,
    owner_id: ObjectId,
    created_at: String,
    show_completed: Boolean,
    sharing_status: String,
    invitation_token: String,
    members: Array,
    sort_type: Number,
    sort_asc: Boolean,
    theme: String,
    position: Number
}, { collection: 'list', versionKey: false })

module.exports = mongoose.model('list', ListSchema)