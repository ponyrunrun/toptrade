const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const timeout = require('connect-timeout')

require("dotenv").config();

const PORT = process.env.PORT || 4500;
const API_BASE_URL = process.env.API_BASE_URL;

const app = express();

app.use(cors({ credentials: true, origin: "*" }));

app.set("json spaces", 2);
app.use(timeout('15s'))


// app.use(express.static("public"))
app.use("/", express.static(path.join(__dirname, "public")));

const config = {
  headers: { "Content-type": "application/x-www-form-urlencoded" },
};

const authBody = {
  grant_type: "client_credentials",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
};

const authMappedData = Object.keys(authBody)
  .map(function (key) {
    return encodeURIComponent(key) + "=" + encodeURIComponent(authBody[key]);
  })
  .join("&");

app.get("/api/", (req, res) => {
  res.send("Some text");
});

app.get("/api/drivers", (req, res) => {
  res.json([{id:"13333"}]);
});

app.get("/api/orders", (req, res) => {
  axios({
    method: "post",
    url: "https://carrier.superdispatch.com/oauth/token/",
    withCredentials: true,
    data: authMappedData,
    config,
  })
    .then((authRes) => {
      const config = {
        headers: {
          Authorization: `Bearer ${authRes.data.access_token}`,
        },
      };

      const dataArr = [];
      let count = 4;

      function getPaginationData(nextUrl) {
        if (!count) {
          res.json(dataArr);
          return;
        }
        count -= 1;
        return axios
          .get(nextUrl, config)
          .then((res1) => {
            dataArr.push(...res1.data.data);
            return getPaginationData(res1.data.pagination.next);
          })
          .catch(() => {
            res.json(dataArr);
            return;
          });
      }

      axios
        .get(`${API_BASE_URL}/orders`, config)
        .then((ordersRes) => {
          const nextUrl = ordersRes.data.pagination.next;
          const data = ordersRes.data.data;
          dataArr.push(...data);
          getPaginationData(nextUrl);
        })
        .catch(() => {
          res.sendStatus(500);
        });
    })
    .catch((err) => {
      return err;
    });
});

app.listen(PORT, () => console.log(`server started on port ${PORT}`));
