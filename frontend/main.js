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
      } else {
        utilityClassHandler(
          '.cc-info-inputs-container .credit-card-info-form',
          'paypalSelected',
          'remove'
        )
        setTimeout(() => {
          window.scrollTo({ top: innerHeight, left: 0, behavior: 'smooth' })
        }, 95)
      }
    })
  })

// document.querySelector('#').addEventListener('keypress', (e) => {
//   const nameValidation = valid.cardholderName(e.target.value)
//   if (!nameValidation.isPotentiallyValid) {
//     console.log('Not Valid Name')
//   }
// })
