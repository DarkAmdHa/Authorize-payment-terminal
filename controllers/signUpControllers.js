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
  const userExists = {}
  const headers = { Authorization: `Ghost ${token}` }
  const response = await axios
    .get(`${process.env.GHOST_URL}/ghost/api/admin/members/`, { headers })
    .then((response) => {
      userExists = response.data.members.find(
        (member) => member.email === email
      )
      if (userExists) {
        return res.status(422)
        throw new Error('User already exists')
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
        res.status(404)
        throw new Error('An error occured in setting up the request')
      }
    })
}

// @desc    Create User on Ghost after successfull transaction
// @route   N/A
// @access  Public
const createUser = async (token, firstName, lastName, email) => {
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

  requestRetry(100, 100, function (error, data) {
    if (error) {
      // still failed after 100 retries
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        res.status(error.response.status)
        throw new Error(error.response.data.message)
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        res.status(401)
        throw new Error('There was an issue with your connection')
      } else {
        // Something happened in setting up the request that triggered an Error
        res.status(404)
        throw new Error('Something happened in setting up the request')
      }
    } else if (data) {
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
      res.status(400)
      throw new Error(
        `Something Went Wrong. Your transaction has gone through successfully, but your account could not be created on our servers due to an error. Your transaction ID is ${10320}. Please contact us at craft@gmail with your email and our staff will help you.`
      )
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
  email
) => {
  const amount = 1
  const merchantAuthenticationType =
    new ApiContracts.MerchantAuthenticationType()
  merchantAuthenticationType.setName(process.env.API_LOGIN_ID)
  merchantAuthenticationType.setTransactionKey(process.env.TRANSACTION_KEY)

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

  ctrl.execute(() => {
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
              responseCode: response.getTransactionResponse().getResponseCode(),
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

          createUser(token, firstName, lastName, email)
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
            error: true,
            message: 'Failed Transaction.',
            data: returnDataObject,
          })
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
          error: true,
          message: 'Failed Transaction.',
          data: returnDataObject,
        })
      }
    } else {
      res.status(400).json({ error: true, message: 'No Response.' })
    }
  })
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
  checkUserExists(token, email, res)

  //Create Transaction
  createTransaction(
    cardNumber,
    expirationDate,
    cvv,
    token,
    firstName,
    lastName,
    email
  )
})

export { signUpUser }
