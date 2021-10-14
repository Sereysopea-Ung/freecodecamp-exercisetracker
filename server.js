const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const ObjectId= require('mongodb').ObjectId;
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

const User = mongoose.model('User', new mongoose.Schema({
  username: {type: String, required: true},
  log: Array
}));

const Exercises = mongoose.model('Exercises', new mongoose.Schema({
  description: {type:String, required: true},
  duration: {type:Number, required: true},
  date: String
}));

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req,res)=>{
  let newUser = new User({
    username: req.body.username,
    log: []
  });
  newUser.save((err,data)=>{
    if (err) return console.log(err);
    res.json({
      username: data.username,
      _id: data.id
    });
  });
});

app.get('/api/users',(req,res)=>{
  let array=[];
  User.find({},function(err,allUserArray){
    if (err) return console.log(err);
    let returnArray = allUserArray.map(user=>{
      return {username:user.username,_id:user.id};
    })

    res.json(returnArray);
  });
});

function convertDate(date){
  if (date){
    return new Date(date).toDateString();
  } else {
    return new Date().toDateString();
  }
}

app.post('/api/users/:_id/exercises',(req,res)=>{
  User.findById(req.body[':_id'],(err,result)=>{
    if (err) return console.log(err);
    if (result==null){
      res.send("_id Not Found");
    } else {
      new Exercises({
        description: req.body.description,
        duration: parseInt(req.body.duration),
        date: convertDate(req.body.date)
      }).save((err,data)=>{
        if (err) return console.log(err);
        result.log.push(data);
        result.save((err,savedresult)=>{
          if (err) return console.log(err);
        });
        res.json({
          username: result.username,
          _id: result.id,
          date: data.date,
          duration: data.duration,
          description: data.description
        });
      }); 
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
