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
document.getElementById("verify_button").addEventListener("click",(e)=>{
  submitForm()
})

function submitForm(){
  var code = document.getElementById("code").value;
    postData("/verify",{
    code
  }).then(d=>{
      if(!d || d.message){
        document.getElementById("splash").innerHTML =(d) ? d.message : "Something went wrong";
      }
  })
}