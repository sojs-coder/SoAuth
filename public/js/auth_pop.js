const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});
async function postData(url = '', data = {}) {

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
document.addEventListener("keypress",(e)=>{
  if(e.which == 13){
    submitForm()
  }
})
document.getElementById("login_button").addEventListener("click",(e)=>{
  submitForm()
})

function submitForm(){
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  password = CryptoJS.SHA256(password);
  password = password.toString()
  if(email !== "" && password !== ""){
  postData("/auth",{
    email: email,
    password: password.toString()
  }).then((d)=>{
    if(d && d["redirect_to"]){
        location.href = d["redirect_to"]
      }
    if(d.token){
      document.querySelector(".heading").innerHTML = "<h1>You can close this window now</h1>";
      window.opener.postMessage({token:d.token},"https://"+params.domain);

      setTimeout(()=>{window.close()},500)
    }else{
      document.getElementById("splash").innerHTML= "Username or password is incorrect";
    }
  });
  }else{
    document.getElementById("splash").innerHTML= "Please put in login information";
  }
}
