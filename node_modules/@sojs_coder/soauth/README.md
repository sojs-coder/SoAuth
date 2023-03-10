# SoAuth-Node

SoAuth express middleware.

## Usage

```js
const soauth = require("@sojs_coder/soauth").soauth;


app.use(soauth);


app.get('/',(req,res)=>{
  console.log(req.so_auth)
  /* 
  {
    user: {
      email: ...,
      fName: ...,
      lName: ...,
      verified: true|false,
      pfp: ...,
      username: ...
    }
  }
  */
})
```