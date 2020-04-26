const mongoose = require('mongoose')

const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const LinkedPreviewSchema = new Schema({
    size: Number,
    content_type: String,
    content_description: {
        label: String
    }
})
const LinkedEntitiesSchema = new Schema({
    weblink: String,
    extension: String,
    display_name: String,
    preview: LinkedPreviewSchema
})
const StepSchema = new Schema({
    title: String,
    completed: Boolean,
    completed_at: String,
    created_at: String,
    position: Number
})
const recurrenceSchema = new Schema({
    days_of_week: Array,
    interval: Number,
    type: String,
    ignore: Boolean
})
const reminderSchema = new Schema({
    type: String,
    snooze_time: Number,
    snoozed_at: String,
    is_snoozed: Boolean,
    date: String
})
const commentSchema = new Schema({
    comment: String,
    username: String,
    user_id: ObjectId,
    submit_at: String
})
const TaskSchema = new Schema({
    title: String,
    local_id: ObjectId,
    list_id: ObjectId,
    created_by: ObjectId,
    created_at: String,
    completed: Boolean,
    completed_at: String,
    completed_by: ObjectId,
    importance: Boolean,
    myDay: Boolean,
    steps: [StepSchema],
    reminder: reminderSchema,
    recurrence: recurrenceSchema,
    due_date: String,
    assignment: {
        assignee: ObjectId,
        assigner: ObjectId
    },
    note: String,
    note_updated_at: String,
    linkedEntities: [LinkedEntitiesSchema],
    position: Number,
    today_position: Number,
    comments: [commentSchema]
}, { collection: 'task', versionKey: false })

module.exports = mongoose.model('task', TaskSchema)