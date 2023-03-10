
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
document.getElementById("save").addEventListener("click",(e)=>{
  submitForm()
});
document.getElementById("pfp").addEventListener("change",(e)=>{
  document.querySelector('img.rounded').src = e.target.value;
})

function submitForm(e){
  var button = document.getElementById("save")
  button.innerHTML = "Saving...";
  button.setAttribute("disabled","true");

  
  var email = document.getElementById("email").value;
  var name = document.getElementById("name").value;
  var pfp = document.getElementById("pfp").value;
  var display = document.getElementById("display").value;
  postData("//soauth.sojs.repl.co/update",{
    email,
    name,
    pfp,
    display
  }).then((d)=>{
    if(d.status == 200){
     button.innerHTML = "Saved!"
      button.removeAttribute("disabled");
      setTimeout(()=>{
        
        button.innerHTML = "Save Profile"
      },1000)
    }else{
      button.innerHTML = "Save Profile"
      button.removeAttribute("disabled");
      document.getElementById("splash").innerHTML= (d.message) ? d.message : "Something went wrong....";
    }
  })
}
