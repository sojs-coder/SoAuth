const fetch = require("node-fetch");

async function postData(data = {}) {
  const url = "https://soauth.sojs.repl.co/checkValid";
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data)
  });
  return response.json();
}
function soauth(req,res,next){
  if(!req.so_auth){
    req.so_auth = {}
  }
  if(!req.cookies){
    console.log("Please install a cookie parser middleware")
  }else{
    if(req.cookies["so-auth"]){
      postData({"token":req.cookies["so-auth"]}).then(d=>{
        if(d.message){ console.log(d.message); req.so_auth.user = false; next()}else{
          req.so_auth.user = d;
          next(d)
        }
      })
    }
  }
}
module.exports = {
  soauth
}