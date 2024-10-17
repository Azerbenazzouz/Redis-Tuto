const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// port 8044
const PORT = process.env.PORT || 8044;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

// API URL
const API_URL = process.env.API_URL || "https://jsonplaceholder.typicode.com/photos/";

app.get("/photos", async (req, res) => {
    const albumId = req.query.albumId;
    const { data } = await axios.get(
        API_URL
        ,{params: {albumId}}
    )
    res.json(data)
})

app.get("/photos/:id", async (req, res) => {
    const photoId = req.params.id;
    const { data } = await axios.get(
        API_URL+photoId,
    )
    return res.json(data)
})

