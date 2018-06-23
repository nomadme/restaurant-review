if ("serviceWorker" in navigator){
  navigator.serviceWorker
    .register("/serviceWorker.js")
    .then(reg =>{
      console.log("Service worker registration done: " + reg.scope);
    })
    .catch(error => {
      console.log("Registration failed: " + error);
    });
}