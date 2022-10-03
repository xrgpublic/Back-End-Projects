require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('node:dns');
var shortUrl;

let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//setting up url schema
const { Schema } = mongoose;
const urlDataBaseSchema = new mongoose.Schema({
    original_url: {
      type: String,
    },
    short_url: {
      type: String
    }
});
let urlEntry = mongoose.model('urlEntry', urlDataBaseSchema);

let urlInfo = 
{
  "origional_url": String,
  "short_url": String
};


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//Recieves url and creates a shortened url that linkes to the original url
app.post('/api/shorturl', function(req, res) {
  let longUrl = req.body.url;

  //makes sure url is in proper format using generic url regex validation
  const isValidUrl = urlString=> {
	  var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
	  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
	  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
	  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
	  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
	  '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
	  return !!urlPattern.test(urlString);
	}
   //if string is valid url
  if(isValidUrl(longUrl)){
    //makes sure url links to site
    dns.lookup(longUrl, function(err, address){
      //if url links to site
      if(address == null){
        //create short url
        shortUrl = "short" + parseInt((Math.random() * 1000), 10);
        // add short url to urlEntry 
        let newEntry = new urlEntry(
        {
          original_url: longUrl,
          short_url: shortUrl
        });
        //save newEntry in urlEntry
        newEntry.save(function(err, data) {
          if (err) return console.error(err);
        });
        //respond with json
        res.json(
        {
          "original_url": newEntry.original_url,
          "short_url": newEntry.short_url
        });
      //if url does not link to site
      }else{
        res.json({error: 'invalid url'});
      }
    });
  // if string is not valid url
  }else{
    //respond with json
    res.json({error: 'invalid url'});
  }
});

app.get('/api/shorturl/:shorturl', (req, res) => {
  // get requested shorturl
  const { shorturl } = req.params;

  //look for document where requested url is the same as short_url
  urlEntry.findOne({short_url: shorturl}, function(err, urlFound) {
    //once found, redirect user to url that the short_url is linked to.
    res.redirect(urlFound.original_url);
  });
}); 


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
