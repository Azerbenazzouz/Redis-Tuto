const express = require("express");
const axios = require("axios");
const cors = require("cors");
const Redis = require("redis");

const app = express();
app.use(cors());

// port 8045
const PORT = process.env.PORT || 8045;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

// Get instance of Redis
const client = Redis.createClient(); // In production, use { url: "redis://<url>" }
// Properly connect to Redis
client.connect().catch(console.error);
client.on('error', (err) => console.log('Redis Client Error', err));

// DEFAULT_EXPIRATION
const DEFAULT_EXPIRATION = 3600;

// API URL
const API_URL = process.env.API_URL || "https://jsonplaceholder.typicode.com/photos/";

// Route to get photos by albumId
app.get("/photos", async (req, res) => {
    const albumId = req.query.albumId;
    try {
        const photos = await getOrSetCache(`photos?albumId=${albumId}`, async () => {
            const { data } = await axios.get(API_URL, { params: { albumId } });
            return data;  // Return data instead of res.json
        });
        return res.json(photos);  // Send the cached or fresh data as response
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Route to get a specific photo by id
app.get("/photo/:id", async (req, res) => {
    const photoId = req.params.id;
    try {
        const photo = await getOrSetCache(`photo:${photoId}`, async () => {
            const { data } = await axios.get(`${API_URL}${photoId}`);
            return data;  // Return data instead of res.json
        });
        return res.json(photo);  // Send the cached or fresh data as response
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Function to get data from cache or fetch fresh data
const getOrSetCache = (key, cb) => {
    return new Promise((resolve, reject) => {
        client.get(key)
            .then(async (data) => {
                if (data != null) {
                    return resolve(JSON.parse(data));  // Return cached data if available
                }
                const freshData = await cb();  // Fetch fresh data if not in cache
                await client.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(freshData));  // Cache the fresh data
                resolve(freshData);  // Resolve with fresh data
            })
            .catch((error) => {
                return reject(error);  // Reject in case of an error
            });
    });
};
