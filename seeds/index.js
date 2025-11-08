const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp-maptiler', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connection open!'))
    .catch(err => console.log('MongoDB connection error:', err));

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDb = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '690a242bb2c667103fc422ee',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ducimus iste at ullam quo eaque veritatis nesciunt, architecto numquam suscipit laborum a sequi placeat omnis?',
            price,
            images: [
                {
                    url: 'https://res.cloudinary.com/dlonf5kd2/image/upload/v1762102441/YelpCamp/ry95usim1cu9la9vjlbg.png',
                    filename: 'YelpCamp/ry95usim1cu9la9vjlbg'
                },
                {
                    url: 'https://res.cloudinary.com/dlonf5kd2/image/upload/v1762102443/YelpCamp/mvk7ycz2neruu1n8cfgh.png',
                    filename: 'YelpCamp/mvk7ycz2neruu1n8cfgh'
                }
            ]
        });
        await camp.save();
    }
};

seedDb().then(() => {
    mongoose.connection.close();
});
