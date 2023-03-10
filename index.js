const express = require("express");
const nunjucks = require("nunjucks");
const SHA256 = require("crypto-js/sha256");
const cookieParser = require('cookie-parser');
const session = require('express-session');
const AWS = require("aws-sdk");
var useragent = require('express-useragent');
const morgan = require("morgan")
const jwt = require('jsonwebtoken');
const cors = require("cors")


function createToken(json){
  const token = jwt.sign(json, process.env.SECRET);
  return token;
}
function verifyToken(token){
  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    return decoded;
  } catch(err) {
    return false;
  }
}



// AWS dynamo setup + functions

AWS.config.update({
  region: "us-west-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
function rand(digits) {
    return Math.floor(Math.random()*parseInt('8' + '9'.repeat(digits-1))+parseInt('1' + '0'.repeat(digits-1)));
}
const sendVerification = async  (email,code)=>{
  getUser(email).then((userres)=>{
    let user = userres.Item;
    if(user){
    const params = {
      Destination: {
        ToAddresses:[email]
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: "<h1>Hello "+ user.fName +"</h1><p>Your SoAuth verification code is "+code+"</p>"
          },
          Text: {
            Charset: "UTF-8",
            Data: "Hello "+user.fName+ "\n. Your SoAuth verification code is"+code
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: "[SoAuth] Verification Code"
        }
      },
      Source: "sojscoder@gmail.com",
      ReplyToAddresses: [
        "sojscoder@gmail.com"
      ]
    }
    var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
    sendPromise.then(
  function(data) {
    
  }).catch(
    function(err) {
    console.error(err, err.stack);
  });
    }
  })
}

// Create the promise and SES service object


// Handle promise's fulfilled/rejected states

const DynamoDB = new AWS.DynamoDB();
const dynamoClient = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = "people";

async function getUser(email){
  const params = {
    TableName: TABLE_NAME,
    Key: {
      email
    }
  }
  try {
    const data = await dynamoClient.get(params).promise();
    return data;
  } catch (err) {
    console.log(err);
  }
}
async function createUser(email,display,fName,lName,passwordHash){
  const params = {
    TableName: TABLE_NAME,
    Item: {
      email,
      display,
      fName,
      lName,
      passwordHash,
      uid: uuid(),
      verified: false,
      pfp: "https://via.placeholder.com/128"
    }
  }
  try {
    const data = await dynamoClient.put(params).promise();
    return data
  } catch (err){
    console.log(err);
  }
}
async function updateUser(email,display,fName,lName,pfp){
  const params = {
    TableName: TABLE_NAME,
    Key: {
      email,
    },
    UpdateExpression: "set display = :dis, fName = :fName, lName = :lName, pfp = :pfp",
    ExpressionAttributeValues: {
      ":dis": display,
      ":fName":fName,
      ":lName":lName,
      ":pfp":pfp
    }
  }
  try {
    const data = await dynamoClient.update(params).promise();
    return data
  } catch (err){
    console.log(err);
  }
}
async function setVerified(email){
  const params = {
    TableName: TABLE_NAME,
    Key: {
      email,
    },
    UpdateExpression: "set verified = :ver",
    ExpressionAttributeValues: {
      ":ver": true
    }
  }
  try {
    const data = await dynamoClient.update(params).promise();
    return data
  } catch (err){
    console.log(err);
  }
}


// express setup

const app = express();

const KEY = SHA256(process.env.KEY).toString();
app.use(useragent.express());
app.use(cookieParser());
app.use(morgan("dev"))
app.use(session({
	secret: process.env.SECRET,
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

// nunjucks setup
nunjucks.configure('views', {
    autoescape:  true,
    express:  app
})
app.set('view engine', 'njk');
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});
app.use(cors({
    allowedHeaders: ["Content-Type", "Authorization","access-control-allow-origin"]
}));


app.use(express.static('public'));


// app.get
app.get("/", (req,res)=>{
  res.render("index.html");
});
app.get("/c-signup",(req,res)=>{
  if(req.session && req.session.user && req.session.user.email){
    res.redirect("/dash");
  }else{
    if(req.cookies["so-auth"]){
      var t = verifyToken(req.cookies["so-auth"])
      if(t){
        req.session.user=t;
        res.redirect("/dash")
      }else{
        res.render("client-sign.html");
      }
    }else{
      res.render("client-sign.html");
    }
    
  }
});
app.get("/auth",(req,res)=>{
  res.render("auth.html",{ ref:req.get('Referrer') });
})
app.get("/signup",(req,res)=>{
  res.render("signup.html",{completion: req.query.completion || false});
})
app.get("/dash",(req,res)=>{
  if(req.session && req.session.user && req.session.user.email){
    res.render("dash.html",{user:req.session.user});
  }else{
    res.redirect("/c-signup");
  }
})
app.get("/verify/:email",(req,res)=>{
  if(req.params["email"]){
  req.session.code = {
    code: rand(6),
    email: req.params["email"]
  }
  sendVerification(req.session.code.email,req.session.code.code);
  res.render("verify.html",{email: req.params["email"]})
  }else{
    res.json({
      status: 500,
      message: "No email specified"
    })
  }
});
app.post("/verify",(req,res)=>{
  if(req.session.code){
    if(req.session.code.code == req.body.code){
      setVerified(req.session.code.email).then((data)=>{
        res.json({status:200,message: "You have been successfully verified"})
      })
      
    }else{
      res.json({
        message:"The code is incorrect. If you can not find the email, check your spam folder"
      })
    }
  }else{
    res.json({status: 401})
  }
})
app.post("/signup",(req,res)=>{
  getUser(req.body.email).then(data=>{
    if(!data.Item || (data.Item && !data.Item.passwordHash)){
      createUser(req.body.email,req.body.display,req.body.fName,req.body.lName,req.body.passwordHash).then(d=>{
        res.json({
          status: 200
        })
      })
    }else{
      res.json({
        message: "Account already exists"
      })
    }
  })
})
app.post("/checkValid",(req,res)=>{

  var token = req.body.token;
  var decode = verifyToken(token);
  if(decode){
    res.json({data:decode})
  }else{
    res.json({
      status: 401,
      message: "Token is invalid"
    })
  }
})
app.post("/auth",(req,res)=>{
  var email = req.body.email;

  getUser(email).then((data)=>{
    var item = data.Item;
    if(item && item.email && !item.passwordHash){
      res.json({
        redirect_to: "/signup?completion="+item.email,
        status: 200
      })
    }else if(item.passwordHash == req.body.password){
      res.json({
        token: createToken({
          email: item.email,
          fName: item.fName,
          lName: item.lName,
          display: item.display,
          pfp: item.pfp,
          verified: item.verified,
          uid: item.uid
        }),
        status: 200
      })
    }else{
      res.json({status:401})

    }
  })
})
app.post("/update",(req,res)=>{
  if(req.session.user){
    if(req.session.user.verified == "true"){
    updateUser(req.session.user.email,req.body.display,req.body.name.split(" ")[0],req.body.name.split(" ")[1],req.body.pfp).then((data)=>{
      req.session.user = {
        email: req.session.user.email,
        name: req.body.name,
        pfp: req.body.pfp,
        display: req.body.display,
        verified: req.session.user.verified,
        uid: req.session.user.uid
      }
    }).then((d)=>{
      res.json({status:200})
    })
    }else{
      res.json({status: 401,message:`<a style = "color: dodgerblue" href = "/verify${req.session.user.email}">Verify your account</a> to modify your profile.`})
    }
  }else{
    res.json({status: 401})
  }
})
app.listen(3000, () => {
  console.log('server started');
});


function uuid() {
    var d = new Date().getTime();
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;
        if(d > 0){
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}