const mongoose = require('mongoose');
var moment = require( 'moment' );

const postSchema = mongoose.Schema({
    title:  String,
    creator: {
        type: String, 
        ref: 'User'
    },
    post: String,
    link: String,
    createdDate: {
        type: Date, 
        default: moment.utc().format('LLL')
    },
    isDeleted: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Post', postSchema);


