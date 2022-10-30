'use strict'

import validator from 'validator'

const validateForm = (req) => {
  const { cardNumber, cvv, expirationDate } = req.body

  const errors = []

  if (!validator.isCreditCard(cardNumber)) {
    errors.push({
      param: 'cardNumber',
      msg: 'Invalid credit card number.',
    })
  }

  if (!/^\d{3}$/.test(cvv)) {
    errors.push({
      param: 'cvv',
      msg: 'Invalid CVV code.',
    })
  }

  if (!/^\d{4}$/.test(expirationDate)) {
    errors.push({
      param: 'expirationDate',
      msg: 'Invalid expiration date.',
    })
  }

  return errors
}

export default validateForm
