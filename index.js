const express = require("express");
const cors = require("cors");
const axios = require("axios");

require("dotenv").config();

const PORT = process.env.PORT || 4500;
const API_BASE_URL = process.env.API_BASE_URL;

const app = express();

app.use(cors({ credentials: true, origin: "*" }));

app.set('json spaces', 2)

const config = {
  headers: { "Content-type": "application/x-www-form-urlencoded" },
};

const body = {
  grant_type: "client_credentials",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
};

app.get("/", (req, res) => {
  axios({
    method: "post",
    url: "https://carrier.superdispatch.com/oauth/token/",
    withCredentials: true,
    data: Object.keys(body)
      .map(function (key) {
        return encodeURIComponent(key) + "=" + encodeURIComponent(body[key]);
      })
      .join("&"),
    config,
  })
    .then((response) => {
      const config = {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`,
        },
      };

      axios
        .get(`${API_BASE_URL}/orders`, config)
        .then((response) => {
          res.json(response.data);
        })
        .catch((error) => {
          res.sendStatus(500);
        });
    })
    .catch((err) => {
      return err;
    });
});


app.listen(PORT, () => console.log(`server started on port ${PORT}`));
