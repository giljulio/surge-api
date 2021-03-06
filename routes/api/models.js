var mongoose = require('mongoose');


module.exports.Video = mongoose.model('Video', {
    title: {
        type: String,
        trim: true,
        index: true,
        required: true
    },
    up_vote: {
        type:Number,
        default: 0
    },
    down_vote: {
        type:Number,
        default: 0
    },
    up_votes_users: {
        type: [String]
    },
    down_votes_users: {
        type: [String]
    },
    surge_rate: {
        type:Number
    },
    controversial: {
        type:Number
    },
    url: {
        type: String,
        trim: true,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    category: {
        type:Number,
        required:true
    },
    uploader: {
        type: String,
        required: true
    },
    featured: {
        type: Boolean,
        default:false
    },
    user_meta: {
        watched : {
            type: [String]
        }
    }
});

module.exports.User = mongoose.model('User', {
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        index: true
    },
    password: String,
    username: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        index: true
    },
    tokens: [Token],
    achievements: [userAchievement],
    surge_points: {
        type: Number,
        min: 0,
        default: 0
    },
    favourites: [String]
});

var userAchievement = mongoose.model('userAchievement', {
    achievementId: {
        type:String,
        index:true
    },
    dateAchieved: {
        type: Date,
        default: Date.now
    }
});

var Token = module.exports.Token = mongoose.model('Token', {
    token: {
        type:String,
        index:true
    },
    expiration: {
        type:Number
    }
});

module.exports.Achievement = mongoose.model('Achievement', {
    id: {
        index: true,
        type:String
    },
    name: {
        index: true,
        type:String
    },
    description: {
        type:String
    },
    surge_points: {
        type:Number
    }
});


