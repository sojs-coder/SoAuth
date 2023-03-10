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
  var display = document.getElementById("display").value;
  var name = document.getElementById("name").value.split(" ");
  password = CryptoJS.SHA256(password);
  password = password.toString()
    postData("//soauth.sojs.repl.co/signup",{
    email,
    display,
    fName: name[0],
    lName: name[1],
    passwordHash: password
  }).then(d=>{
      if(!d || d.message){
        document.getElementById("splash").innerHTML =(d) ? d.message : "Something went wrong";
      }else{
        location.href= "//soauth.sojs.repl.co/auth";
      }
  })
}