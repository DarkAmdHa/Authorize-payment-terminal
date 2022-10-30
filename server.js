import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import formidable from 'formidable'
import dotenv from 'dotenv'
import authorize from 'authorizenet'
import validateForm from './validateInput/creditCardValidate.js'
dotenv.config()
const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ApiContracts = authorize.APIContracts
const ApiControllers = authorize.APIControllers
const SDKConstants = authorize.Constants

const PORT = process.env.PORT || 3000

app.use(express.static('frontend'))
app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/frontend/index.html'))
})
app.post('/sign-up', (req, res) => {
  console.log(req.body)

  // const validationErrors = validateForm(req)
  // if (validationErrors.length > 0) {
  //   res.json({ errors: validationErrors })
  //   return
  // }

  const { cardNumber, cvv, expirationDate } = req.body

  const amount = 20
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
    console.log(JSON.stringify(response, null, 2))
    if (response != null) {
      if (
        response.getMessages().getResultCode() ==
        ApiContracts.MessageTypeEnum.OK
      ) {
        if (response.getTransactionResponse().getMessages() != null) {
          console.log(
            'Successfully created transaction with Transaction ID: ' +
              response.getTransactionResponse().getTransId()
          )
          console.log(
            'Response Code: ' +
              response.getTransactionResponse().getResponseCode()
          )
          console.log(
            'Message Code: ' +
              response
                .getTransactionResponse()
                .getMessages()
                .getMessage()[0]
                .getCode()
          )
          console.log(
            'Description: ' +
              response
                .getTransactionResponse()
                .getMessages()
                .getMessage()[0]
                .getDescription()
          )
        } else {
          console.log('Failed Transaction.')
          if (response.getTransactionResponse().getErrors() != null) {
            console.log(
              'Error Code: ' +
                response
                  .getTransactionResponse()
                  .getErrors()
                  .getError()[0]
                  .getErrorCode()
            )
            console.log(
              'Error message: ' +
                response
                  .getTransactionResponse()
                  .getErrors()
                  .getError()[0]
                  .getErrorText()
            )
          }
        }
      } else {
        console.log('Failed Transaction.')
        if (
          response.getTransactionResponse() != null &&
          response.getTransactionResponse().getErrors() != null
        ) {
          console.log(
            'Error Code: ' +
              response
                .getTransactionResponse()
                .getErrors()
                .getError()[0]
                .getErrorCode()
          )
          console.log(
            'Error message: ' +
              response
                .getTransactionResponse()
                .getErrors()
                .getError()[0]
                .getErrorText()
          )
        } else {
          console.log(
            'Error Code: ' + response.getMessages().getMessage()[0].getCode()
          )
          console.log(
            'Error message: ' + response.getMessages().getMessage()[0].getText()
          )
        }
      }
    } else {
      console.log('Null Response.')
    }
  })
})

app.listen(
  PORT,
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
)
