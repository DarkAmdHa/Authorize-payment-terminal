(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const initiateSubscribe = async () => {
  if (localStorage.getItem('refTransferId')) {
    try {
      const response = await axios.post(
        '/subscribe',
        JSON.parse(localStorage.getItem('refTransferId'))
      )
      const data = response.data

      document.querySelector('.status .title').innerText = 'Success'
      document.querySelector(
        '.status .statusText'
      ).innerHTML = `<p>${data.message}</p>`
      document.querySelector(
        '.status .statusText'
      ).innerHTML += `<p>Please click <a href='https://craft-farmer-academy.ghost.io/'>here</a> to head to Craft Farmer Accademy and login.</p>`

      localStorage.removeItem('refTransferId')
    } catch (error) {
      let errorMsg
      error.response && error.response.data.message != 'undefined'
        ? (errorMsg = error.response.data.message)
        : (errorMsg = error.message)
      document.querySelector('.status .title').innerText = 'Error'
      document.querySelector(
        '.status .statusText'
      ).innerHTML = `<p>${errorMsg}</p>`
    }
  } else {
    document.querySelector('.status').innerHTML =
      'No PayPal transaction in progress. Please head <a href="/">here</a> to initiate one.'
  }
}

initiateSubscribe()

},{}]},{},[1]);
