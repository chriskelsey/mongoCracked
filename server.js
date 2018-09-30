//Required packages
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");

//Initialize and apps
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/crackedScraper";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

const db = require("./models");
app.use(express.static("public"));


app.get("/scrape", function(req, res) {
	axios.get("http://www.cracked.com/funny-articles.html").then(function(response) {
		const $ = cheerio.load(response.data);
		$("#contentList .content-card .content-card-content").each(function(i, element) {
			const result = {};
			//cache this
			const $this = $(this);
			result.title = $this.children("h3").text();
			result.summary = $this.find(".clickablep").text();
      		result.link = $this.find("a").attr("href");

      	db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          return res.json(err);
        });
    });
    res.send("Articles Gathered! Rejoice!");

	});
});

app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

//For testing only
app.get("/purge", function(req,res) {
	db.Article.remove({}, function(err, removed) {
		res.send("... and we're clean")
	})
	.catch(function(err) {
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
	console.log(`Listening on PORT: ${PORT}`);
});