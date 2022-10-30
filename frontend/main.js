const valid = require('card-validator')

const changeSelectedCardType = (cardType) => {
  document.querySelector(
    `.card-radio-container #card-type[value="${cardType}"]`
  ).checked = true
  document.querySelector('.card-radio-container').classList.add('selectedType')
}

const uncheckAllTypes = () => {
  document
    .querySelectorAll('.card-radio-container #card-type')
    .forEach((card) => {
      card.checked = false
    })
}

const utilityClassHandler = (target, className, addRemove) => {
  if (addRemove === 'add') {
    document.querySelector(target).classList.add(className)
  } else {
    document.querySelector(target).classList.remove(className)
  }
}

const validateInput = (e, extraValidation) => {
  if (isNaN(+e.key)) {
    e.preventDefault()
    return false
  }
  if (extraValidation) {
    extraValidation(e)
  }
}

const validateOnEnter = (target, extraValidation) => {
  document.querySelector(`${target}`).addEventListener('keypress', (e) => {
    extraValidation ? validateInput(e, extraValidation) : validateInput(e)
  })

  document
    .querySelector(`${target}`)
    .addEventListener('paste', (e) => e.preventDefault())
}

const errorMsg = (error) => {
  console.log(error)
}

validateOnEnter('#card-number')
validateOnEnter('#zip-code')
validateOnEnter('#cvv')
validateOnEnter('#expiration[name="expiration-month"]', (e) => {
  if (+(e.target.value + e.key) > 12) {
    e.target.value = 12
    e.preventDefault()
    return false
  }
})
validateOnEnter('#expiration[name="expiration-year"]')

document.querySelector('#card-number').addEventListener('input', (e) => {
  if (e.target.value != '') {
    const numberValidation = valid.number(e.target.value)

    if (!numberValidation.isPotentiallyValid) {
      utilityClassHandler(
        '.card-number-input-container',
        'invalidNumber',
        'add'
      )
      uncheckAllTypes()
      utilityClassHandler('.card-radio-container', 'selectedType', 'add')
    } else {
      utilityClassHandler(
        '.card-number-input-container',
        'invalidNumber',
        'remove'
      )

      if (numberValidation.card?.type === 'visa') {
        changeSelectedCardType('Visa')
      } else if (numberValidation.card?.type === 'mastercard') {
        changeSelectedCardType('Mastercard')
      } else if (numberValidation.card?.type === 'american-express') {
        changeSelectedCardType('American Express')
      } else if (numberValidation.card?.type === 'discover') {
        changeSelectedCardType('Discover')
      } else {
        uncheckAllTypes()
        utilityClassHandler('.card-radio-container', 'selectedType', 'remove')
      }
    }
  } else {
    uncheckAllTypes()
    utilityClassHandler('.card-radio-container', 'selectedType', 'remove')
    utilityClassHandler(
      '.card-number-input-container',
      'invalidNumber',
      'remove'
    )
  }
})

document
  .querySelectorAll(`.card-radio-container #card-type`)
  .forEach((cardRadio) => {
    cardRadio.addEventListener('input', (e) => {
      if (e.target.value === 'PayPal') {
        utilityClassHandler(
          '.cc-info-inputs-container .credit-card-info-form',
          'paypalSelected',
          'add'
        )

        document
          .querySelectorAll('.credit-card-info-form input')
          .forEach((input) => (input.required = false))
      } else {
        utilityClassHandler(
          '.cc-info-inputs-container .credit-card-info-form',
          'paypalSelected',
          'remove'
        )
        document
          .querySelectorAll('.credit-card-info-form input')
          .forEach((input) => (input.required = true))
        setTimeout(() => {
          window.scrollTo({ top: innerHeight, left: 0, behavior: 'smooth' })
        }, 95)
        if (e.target.value === 'Mastercard') {
          document.querySelector('#cvv').maxLength = 4
        } else {
          document.querySelector('#cvv').maxLength = 3
        }
      }
    })
  })

const mainForm = document.querySelector('form.user-details')
document.querySelector('form.user-details').addEventListener('submit', (e) => {
  e.preventDefault()

  const expirationDate =
    mainForm.querySelector('input[name="expiration-month"]').value +
    '/' +
    mainForm.querySelector('input[name="expiration-year"]').value

  const errorArray = []

  if (mainForm.querySelector('input[name="first-name"]').value.length <= 1) {
    errorArray.push({
      message: 'Please provide a valid first name',
      location: 'input[name="first-name"]',
    })
  }
  if (mainForm.querySelector('input[name="last-name"]').value.length <= 1) {
    errorArray.push({
      message: 'Please provide a valid last name',
      location: 'input[name="last-name"]',
    })
  }
  if (mainForm.querySelector('input[name="address"]').value.length <= 3) {
    errorArray.push({
      message: 'Please provide a valid address',
      location: 'input[name="address"]',
    })
  }
  if (mainForm.querySelector('input[name="city"]').value.length <= 1) {
    errorArray.push({
      message: 'Please provide a valid city name',
      location: 'input[name="city"]',
    })
  }
  if (mainForm.querySelector('#state-province').value == '') {
    errorArray.push({
      message:
        'Please select a state. If your state does not figure on the list, please select "Others"',
      location: '#state-province',
    })
  }
  if (mainForm.querySelector('#zip-code').value.length < 3) {
    errorArray.push({
      message: 'Please provide a valid zip code',
      location: '#zip-code',
    })
  }
  if (
    !mainForm.querySelector('input[name="card-type"]:checked') ||
    !valid.number(mainForm.querySelector('#card-number').value)
      .isPotentiallyValid
  ) {
    errorArray.push({
      message: 'Please provide a valid card number',
      location: '#card-number',
    })
  }
  if (
    !valid.cardholderName(mainForm.querySelector('#card-name').value)
      .isPotentiallyValid
  ) {
    errorArray.push({
      message: 'Please provide a valid name on the card',
      location: '#card-name',
    })
  }
  if (!valid.expirationDate(expirationDate).isPotentiallyValid) {
    errorArray.push({
      message: 'Please provide a valid expiration date of the card',
      location: '#expiration',
    })
  }
  if (
    mainForm.querySelector('input[name="card-type"]:checked').value ===
      'Mastercard' &&
    !valid.cvv(mainForm.querySelector('#cvv').value, 4).isPotentiallyValid
  ) {
    errorArray.push({
      message:
        'Please provide a valid digit CID for your American Express card',
      location: '#cvv',
    })
  } else if (!valid.cvv(mainForm.querySelector('#cvv').value, 3)) {
    errorArray.push({ message: 'Please provide a valid CVV', location: '#cvv' })
  }
  if (errorArray.length >= 1) {
    errorArray.forEach((error) => {
      errorMsg(error.message, error.location)
    })
    return false
  } else {
    // Build formData object.

    let jsObjectFormData = {
      firstName: mainForm.querySelector('input[name="first-name"]').value,
      lastName: mainForm.querySelector('input[name="last-name"]').value,
      address: mainForm.querySelector('input[name="address"]').value,
      city: mainForm.querySelector('input[name="city"]').value,
      country: mainForm.querySelector('#country').value,
      state: mainForm.querySelector('#state-province').value,
      zipCode: mainForm.querySelector('#zip-code').value,
      email: mainForm.querySelector('input[name="email"]').value,
      cardType: mainForm.querySelector('input[name="card-type"]:checked').value,
      cardName: mainForm.querySelector('#card-name').value,
      cardNumber: mainForm.querySelector('#card-number').value,
      expirationDate: expirationDate,
      cvv: mainForm.querySelector('#cvv').value,
    }

    console.log(jsObjectFormData)

    fetch('/sign-up', {
      body: JSON.stringify(jsObjectFormData),
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
    })
  }
})
// document.querySelector('#').addEventListener('keypress', (e) => {
//   const nameValidation = valid.cardholderName(e.target.value)
//   if (!nameValidation.isPotentiallyValid) {
//     console.log('Not Valid Name')
//   }
// })
