const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const redis = require('redis');
const winston = require('winston');
const aiService = require('./aiService');
const blockchainService = require('./blockchain');
const Strategy = require('./models/Strategy');
const Trade = require('./models/Trade');
const {
  securityHeaders,
  apiLimiter,
  strictLimiter,
  flashLoanLimiter,
  validateInput,
  module.exports = app;
