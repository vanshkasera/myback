const express = require('express');
const router = express.Router();
const { getUsers, registerUser } = require('../controllers/userController');

// @route   GET /api/users
// @desc    Get all users
// @access  Public
router.get('/', getUsers);
router.post('/', registerUser);

// @route   POST /api/users
// @desc    Register a new user
// @access  Public


module.exports = router;
