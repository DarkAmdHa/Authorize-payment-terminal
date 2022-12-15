import valid from 'card-validator'

const validateForm = (req) => {
  const {
    firstName,
    lastName,
    address,
    city,
    country,
    state,
    zipCode,
    email,
    cardType,
    cardName,
    cardNumber,
    expirationDate,
    cvv,
  } = req.body

  var emailRegex =
    /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/

  function isEmailValid(email) {
    if (!email) return false

    if (email.length > 254) return false

    var valid = emailRegex.test(email)
    if (!valid) return false

    // Further checking of some things regex can't handle
    var parts = email.split('@')
    if (parts[0].length > 64) return false

    var domainParts = parts[1].split('.')
    if (
      domainParts.some(function (part) {
        return part.length > 63
      })
    )
      return false

    return true
  }

  const errors = []

  if (firstName.length <= 1) {
    errorArray.push({
      msg: 'Invalid first name',
      param: 'input[name="first-name"]',
    })
  }

  if (lastName.length <= 1) {
    errorArray.push({
      msg: 'Invalid last name',
      param: 'input[name="last-name"]',
    })
  }

  if (address.length <= 3) {
    errorArray.push({
      msg: 'Invalid address',
      param: 'input[name="address"]',
    })
  }

  if (city.length <= 1) {
    errorArray.push({
      msg: 'Inalid city name',
      param: 'input[name="city"]',
    })
  }

  if (state == '') {
    errorArray.push({
      msg: 'Select a State',
      param: '#state-province',
    })
  }

  if (country == '') {
    errorArray.push({
      msg: 'Select a Country',
      param: '#country',
    })
  }

  if (zipCode.length < 3) {
    errorArray.push({
      msg: 'Invalid zip code',
      location: '#zip-code',
    })
  }

  if (!isEmailValid(email)) {
    errors.push({
      param: '#email',
      msg: 'Invalid email.',
    })
  }
  if (cardType != 'PayPal') {
    if (!valid.cardholderName(cardName).isPotentiallyValid) {
      errors.push({
        msg: 'Please provide a valid name on the card',
        param: '#card-name',
      })
    }

    if (!valid.number(cardNumber).isPotentiallyValid) {
      errors.push({
        param: '#card-number',
        msg: 'Invalid credit card number.',
      })
    }

    if (cardType.value === 'American Express' && !valid.cvv(cvv, 4).isValid) {
      errors.push({
        param: '#cvv',
        msg: 'Please provide a valid digit CID for your American Express card.',
      })
    } else if (!valid.cvv(cvv, 3).isValid) {
      errors.push({
        param: '#cvv',
        msg: 'Please provide a valid CVV',
      })
    }

    if (!valid.expirationDate(expirationDate).isPotentiallyValid) {
      errors.push({
        param: '#expiration',
        msg: 'Invalid expiration date.',
      })
    }
  }

  return errors
}

export default validateForm
