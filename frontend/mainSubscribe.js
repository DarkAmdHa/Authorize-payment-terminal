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
