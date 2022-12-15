import asyncHandler from 'express-async-handler'
import axios from 'axios'
import authorize from 'authorizenet'
import validateForm from '../validateInput/creditCardValidate.js'
import generateToken from '../utils/generateToken.js'
const ApiContracts = authorize.APIContracts
const ApiControllers = authorize.APIControllers
const SDKConstants = authorize.Constants

// @desc    Check if provided email already exists using Ghost API
// @route   N/A
// @access  Public
const checkUserExists = async (token, email, res) => {
  console.log('Checking User Exists')
  let userExists = {}
  const headers = { Authorization: `Ghost ${token}` }
  const response = await axios
    .get(`${process.env.GHOST_URL}/ghost/api/admin/members/`, { headers })
    .then((response) => {
      userExists = response.data.members.find(
        (member) => member.email === email
      )
      if (userExists) {
        console.log('User Exists. Exiting.')
      } else {
        console.log('User Does Not Exist')
      }
    })
    .catch((error) => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        res.status(error.response.status)
        throw new Error(`${error.response.data.message}`)
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        res.status(401)
        throw new Error('There was an issue with your connection')
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log(error)
        res.status(404)
        throw new Error('An error occured in setting up the request')
      }
    })

  return userExists
}

// @desc    Create User on Ghost after successfull transaction
// @route   N/A
// @access  Public
const createUser = async (
  token,
  firstName,
  lastName,
  email,
  res,
  authorizeMessage
) => {
  console.log('Signing Up User On Ghost')

  //Create new user:
  // Make an authenticated request to create a user
  const url = `${process.env.GHOST_URL}/ghost/api/admin/members/`
  const headers = { Authorization: `Ghost ${token}` }
  const payload = {
    members: [
      {
        name: firstName + ' ' + lastName,
        email: email,
        subscribed: true,
        labels: [{ name: 'AddedFromTerminal', slug: 'addedfromterminal' }],
      },
    ],
  }

  function requestRetry(retryTimes, retryDelay, callback) {
    var cntr = 0
    function run() {
      // try the async operation
      ++cntr
      axios
        .post(url, payload, { headers })
        .then((response) => {
          // success, send the data out
          callback(null, response)
        })
        .catch((error) => {
          if (cntr >= retryTimes) {
            // if it fails too many times, just send the error out
            callback(error)
          } else {
            // try again after a delay
            setTimeout(run, retryDelay)
          }
        })
    }
    // start our first request
    run()
  }

  requestRetry(1000, 100, function (error, data) {
    if (data) {
      console.log('User Signed Up On Ghost')

      // got successful result here
      res.status(200).json({
        success: true,
        message:
          'Account with email ' +
          payload.members[0].email +
          ' succesfully created at Craft Farmer Accademy.',
        authorizeMessage,
      })
    } else {
      res.status(400).json({
        message: `Something Went Wrong. Your transaction has gone through successfully, but your account could not be created on our servers due to an error. Your transaction ID is ${authorizeMessage.data.transactionId}. Please contact us as soon as possible, at craft@gmail with your email and our staff will help you.`,
      })
    }
  })
}

// @desc    Create Transaction with Authorize API, and then create User at Ghost API
// @route   N/A
// @access  Public
const createTransaction = async (
  cardNumber,
  expirationDate,
  cvv,
  token,
  firstName,
  lastName,
  email,
  res,
  cardType
) => {
  console.log('Creating Transaction')
  const amount = 1
  const merchantAuthenticationType =
    new ApiContracts.MerchantAuthenticationType()
  merchantAuthenticationType.setName(process.env.API_LOGIN_ID)
  merchantAuthenticationType.setTransactionKey(process.env.TRANSACTION_KEY)

  if (cardType === 'PayPal') {
    var payPal = new ApiContracts.PayPalType()
    payPal.setCancelUrl(`${process.env.TERMINAL_URL}/subscribe`)
    payPal.setSuccessUrl(`${process.env.TERMINAL_URL}/subscribe`)
    const paymentType = new ApiContracts.PaymentType()
    paymentType.setPayPal(payPal)

    var transactionRequestType = new ApiContracts.TransactionRequestType()
    transactionRequestType.setTransactionType(
      ApiContracts.TransactionTypeEnum.AUTHONLYTRANSACTION
    )
    transactionRequestType.setPayment(paymentType)
    transactionRequestType.setAmount(amount)

    var userField_a = new ApiContracts.UserField()
    userField_a.setName('email')
    userField_a.setValue(email)

    var userField_b = new ApiContracts.UserField()
    userField_b.setName('name')
    userField_b.setValue(firstName + lastName)

    var userFieldList = []
    userFieldList.push(userField_a)
    userFieldList.push(userField_b)

    var userFields = new ApiContracts.TransactionRequestType.UserFields()
    userFields.setUserField(userFieldList)

    var createRequest = new ApiContracts.CreateTransactionRequest()
    createRequest.setMerchantAuthentication(merchantAuthenticationType)
    createRequest.setTransactionRequest(transactionRequestType)

    var ctrl = new ApiControllers.CreateTransactionController(
      createRequest.getJSON()
    )

    ctrl.execute(function () {
      var apiResponse = ctrl.getResponse()

      var response = new ApiContracts.CreateTransactionResponse(apiResponse)

      console.log(JSON.stringify(response, null, 2))

      if (response != null) {
        if (
          response.getMessages().getResultCode() ==
          ApiContracts.MessageTypeEnum.OK
        ) {
          if (response.getTransactionResponse().getMessages() != null) {
            // got successful result here
            res.status(200).json({
              success: true,
              refTransferId: response.getTransactionResponse().getTransId(),
              secureAcceptanceURL: response
                .getTransactionResponse()
                .getSecureAcceptance()
                .getSecureAcceptanceUrl(),
              message:
                'Successfully created transaction with Transaction ID: ' +
                response.getTransactionResponse().getTransId() +
                '<br> You will be redirected to the PayPal Express Checkout to complete the transaction, after which, your account will be created with the given email.',
            })
          } else {
            const returnDataObject = {}
            if (response.getTransactionResponse().getErrors() != null) {
              returnDataObject.errorCode = response
                .getTransactionResponse()
                .getErrors()
                .getError()[0]
                .getErrorCode()

              returnDataObject.errorMessage = response
                .getTransactionResponse()
                .getErrors()
                .getError()[0]
                .getErrorText()

              res.status(400).json({
                message: `This error is from our payment gateway: <br> Error ${returnDataObject.errorCode}: ${returnDataObject.errorMessage}`,
              })
            }
          }
        } else {
          const returnDataObject = {}
          if (
            response.getTransactionResponse() != null &&
            response.getTransactionResponse().getErrors() != null
          ) {
            returnDataObject.errorCode = response
              .getTransactionResponse()
              .getErrors()
              .getError()[0]
              .getErrorCode()
            returnDataObject.errorMessage = response
              .getTransactionResponse()
              .getErrors()
              .getError()[0]
              .getErrorText()
          } else {
            returnDataObject.errorCode = response
              .getMessages()
              .getMessage()[0]
              .getCode()
            returnDataObject.errorMessage = response
              .getMessages()
              .getMessage()[0]
              .getText()
          }
          res.status(400).json({
            message: `This error is from our payment gateway: <br> Error ${
              returnDataObject.errorCode || 'N/A'
            }: ${returnDataObject.errorMessage || 'N/A'}`,
          })
        }
      } else {
        res
          .status(400)
          .json({ message: `No Response from the payment gateway` })
      }
    })
  } else {
    const creditCard = new ApiContracts.CreditCardType()
    creditCard.setCardNumber(cardNumber)
    creditCard.setExpirationDate(expirationDate)
    creditCard.setCardCode(cvv)

    const paymentType = new ApiContracts.PaymentType()
    paymentType.setCreditCard(creditCard)

    const transactionSetting = new ApiContracts.SettingType()
    transactionSetting.setSettingName('recurringBilling')
    transactionSetting.setSettingValue('false')

    const transactionSettingList = []
    transactionSettingList.push(transactionSetting)

    const transactionSettings = new ApiContracts.ArrayOfSetting()
    transactionSettings.setSetting(transactionSettingList)

    const transactionRequestType = new ApiContracts.TransactionRequestType()
    transactionRequestType.setTransactionType(
      ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
    )
    transactionRequestType.setPayment(paymentType)
    transactionRequestType.setAmount(amount)
    transactionRequestType.setTransactionSettings(transactionSettings)

    const createRequest = new ApiContracts.CreateTransactionRequest()
    createRequest.setMerchantAuthentication(merchantAuthenticationType)
    createRequest.setTransactionRequest(transactionRequestType)

    const ctrl = new ApiControllers.CreateTransactionController(
      createRequest.getJSON()
    )

    ctrl.execute(async () => {
      const apiResponse = ctrl.getResponse()
      const response = new ApiContracts.CreateTransactionResponse(apiResponse)
      if (response != null) {
        if (
          response.getMessages().getResultCode() ==
          ApiContracts.MessageTypeEnum.OK
        ) {
          if (response.getTransactionResponse().getMessages() != null) {
            const authorizeMessage = {
              message:
                'Successfully created transaction with Transaction ID: ' +
                response.getTransactionResponse().getTransId(),
              data: {
                transactionId: response.getTransactionResponse().getTransId(),
                responseCode: response
                  .getTransactionResponse()
                  .getResponseCode(),
                messageCode: response
                  .getTransactionResponse()
                  .getMessages()
                  .getMessage()[0]
                  .getCode(),
                description: response
                  .getTransactionResponse()
                  .getMessages()
                  .getMessage()[0]
                  .getDescription(),
              },
            }

            await createUser(
              token,
              firstName,
              lastName,
              email,
              res,
              authorizeMessage
            )
          } else {
            const returnDataObject = {}
            if (response.getTransactionResponse().getErrors() != null) {
              returnDataObject.errorCode = response
                .getTransactionResponse()
                .getErrors()
                .getError()[0]
                .getErrorCode()

              returnDataObject.errorMessage = response
                .getTransactionResponse()
                .getErrors()
                .getError()[0]
                .getErrorText()
            }
            res.status(400).json({
              message: `This error is from our payment gateway: <br> Error ${returnDataObject.errorCode}: ${returnDataObject.errorMessage}`,
            })
            //   throw new Error(`This error is from our payment gateway: <br> Error ${returnDataObject.errorCode}: ${returnDataObject.errorMessage}`)
          }
        } else {
          const returnDataObject = {}
          if (
            response.getTransactionResponse() != null &&
            response.getTransactionResponse().getErrors() != null
          ) {
            returnDataObject.errorCode = response
              .getTransactionResponse()
              .getErrors()
              .getError()[0]
              .getErrorCode()

            returnDataObject.errorMessage = response
              .getTransactionResponse()
              .getErrors()
              .getError()[0]
              .getErrorText()
          } else {
            returnDataObject.errorCode = response
              .getMessages()
              .getMessage()[0]
              .getCode()
            returnDataObject.errorMessage = response
              .getMessages()
              .getMessage()[0]
              .getText()
          }
          res.status(400).json({
            message: `This error is from our payment gateway: <br> Error ${returnDataObject.errorCode}: ${returnDataObject.errorMessage}`,
          })

          // throw new Error(
          //   `This error is from our payment gateway: <br> Error ${returnDataObject.errorCode}: ${returnDataObject.errorMessage}`
          // )
        }
      } else {
        res
          .status(400)
          .json({ message: `No Response from the payment gateway` })

        //   throw new Error(`No Response from the payment gateway`)
      }
    })
  }
}

// @desc    Validate Transaction, and Upon success, Create User
// @route   /sign-up
// @access  Public
const signUpUser = asyncHandler(async (req, res) => {
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
  const validationErrors = validateForm(req)
  if (validationErrors.length > 0) {
    res.status(400).json({ errors: validationErrors })
    return
  }

  const token = generateToken()

  //Check for Existing User Email On Ghost
  const userExists = await checkUserExists(token, email, res)

  if (userExists) {
    res.status(422)
    throw new Error('User already exists')
    return
  }
  //Create Transaction
  await createTransaction(
    cardNumber,
    expirationDate,
    cvv,
    token,
    firstName,
    lastName,
    email,
    res,
    cardType
  )
})

export { signUpUser }
