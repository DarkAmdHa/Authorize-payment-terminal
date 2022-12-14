const errorHandler = (err, req, res, next) => {
  const error = res.statusCode === 200 ? 500 : res.statusCode
  res.status(error)
  res.json({
    message: err.message,
  })
}

export { errorHandler }
