// index.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


//if there is no date parameter
app.get('/api', (req, res) => {
  //get current date
  let currentDate = new Date();
  //send current date
  return res.json(
    {
      "unix": currentDate.getTime(),
      "utc": currentDate.toUTCString()
    }
  );
});
        
//if date is put in parameter
app.get('/api/:date', (req, res) => {
  //turn :date into date
  const {date} = req.params;
  let requestedDate = new Date(date);

  //if :date could not be turned into date,
  //try parsing it then turning into date
  if (requestedDate.toString() === 'Invalid Date') {
    requestedDate = new Date(parseInt(date));
  }
  console.log("here "+ requestedDate);
  if (requestedDate.toString() === 'Invalid Date'){
    return res.json({ "error": "Invalid Date"});
  }
  else{
  //send json doc. 
    return res.json(
      {
        "unix": requestedDate.getTime(),
        "utc": requestedDate.toUTCString()
      }
    );
  }
});



// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
