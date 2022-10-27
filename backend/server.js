import express from 'express'
import dotenv from 'dotenv'
import authorize from 'authorizenet'
import validateForm from './validateInput/creditCardValidate.js'
dotenv.config()
const app = express()

const ApiContracts = authorize.APIContracts
const ApiControllers = authorize.APIControllers
const SDKConstants = authorize.Constants

const PORT = process.env.PORT || 3000

app.post('/sign-up', (req, res) => {
  const validationErrors = validateForm(req)
  if (validationErrors.lenght > 0) {
    res.json({ errors: validationErrors })
    return
  }

  const { cc, cvv, expire, amount } = req.body

  const MerchantAuthenticationType =
    new ApiContracts.MerchantAuthenticationType()
  MerchantAuthenticationType.setName(process.env.API_LOGIN_ID)
  MerchantAuthenticationType.setTransactionKey(process.env.TRANSACTION_KEY)

  const creditCard = new ApiContracts.CreditCardType()
  creditCard.setCardNumber(cc)
  creditCard.setExpirationDate(expire)
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

    if (response !== null) {
      if (
        response.getMessages().getResultCode() ===
        ApiContracts.MessageTypeEnum.OK
      ) {
        if (response.getTransactionResponse().getMessages() !== null) {
          res.json({ success: 'Transaction was successful.' })
        } else {
          if (response.getTransactionResponse().getErrors() !== null) {
            let code = response
              .getTransactionResponse()
              .getErrors()
              .getError()[0]
              .getErrorCode()
            let text = response
              .getTransactionResponse()
              .getErrors()
              .getError()[0]
              .getErrorText()
            res.json({
              error: `${code}: ${text}`,
            })
          } else {
            res.json({ error: 'Transaction failed.' })
          }
        }
      } else {
        if (
          response.getTransactionResponse() !== null &&
          response.getTransactionResponse().getErrors() !== null
        ) {
          let code = response
            .getTransactionResponse()
            .getErrors()
            .getError()[0]
            .getErrorCode()
          let text = response
            .getTransactionResponse()
            .getErrors()
            .getError()[0]
            .getErrorText()
          res.json({
            error: `${code}: ${text}`,
          })
        } else {
          let code = response.getMessages().getMessage()[0].getCode()
          let text = response.getMessages().getMessage()[0].getText()
          res.json({
            error: `${code}: ${text}`,
          })
        }
      }
    } else {
      res.json({ error: 'No response.' })
    }
  })
})

app.listen(
  PORT,
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
)
