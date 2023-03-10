try{
var authWindow;
window.addEventListener("message",(data)=>{
  if(data.origin == "https://soauth.sojs.repl.co"){
    data = data.data;
    if(data.token){
      createCookie("so-auth",data.token, 1);
    
      setTimeout(()=>{authwindow.close()},500);
  
      location.reload(true);
    }
  }
})
function createCookie(cname, cvalue, exhours) {
  const d = new Date();
  d.setTime(d.getTime() + (exhours*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
async function postData(url = '', data = {}) {

  const response = await fetch(url, {
    method: 'POST',
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(data)
  });
  
  return response.json()
}

var popUpButton = document.getElementById("SoAuthButton")
if(popUpButton){
  popUpButton.addEventListener("click",(e)=>{
    var h = 600;
    var w = 400;
    var left = screen.width / 2 - w / 2;
    var top = screen.height / 2 - h / 2;

    authWindow = window.open(
      'https://soauth.sojs.repl.co/auth?domain=' + location.host,
      '_blank',
      'modal =yes, toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' +
        w +
        ', height=' +
        h +
        ', top=' +
        top +
        ', left=' +
        left,
    );
    
  })
}else{
  console.log("Please add an id of 'SoAuthButton' to an element to enable the popup")
}
window.SOAUTH = {};
window.SOAUTH.getUser = ()=>{
  return new Promise ((r,rr)=>{
    postData("//soauth.sojs.repl.co/checkValid",{
      token: getCookie("so-auth")
    }).then(d=>{
      if(!d.message){
        var d = d.data;
        r({
          email: d.email,
          fName: d.fName,
          lName: d.lName,
          display: d.display,
          pfp: d.pfp,
          verified: d.verified
        })
      }else{
        //alert(d.message)
      }
    })
  })
}
}catch(err){
  alert(err  )
}