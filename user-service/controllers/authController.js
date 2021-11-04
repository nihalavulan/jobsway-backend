const bcrypt = require('bcrypt')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const db = require('../config/connection')
const { USER_COLLECTION } = require('../config/collection')
const collection = require('../config/collection')
const SERVICE_ID = process.env.SERVICE_ID
const ACCOUNT_SID = process.env.ACCOUNT_SID
const AUTH_TOKEN = process.env.AUTH_TOKEN
const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN)
const { validationResult } = require('express-validator')


module.exports = {
    getDashboard: (req, res) => {
        res.send('This is user home.')
    },
    signup: async (req, res) => {
        const { email, firstName, lastName, password } = req.body
        var errors = validationResult(req)

        //Signup user
        try {
            //Express Validator error.
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() })
            }

            var userExist = await db.get().collection(collection.USER_COLLECTION).findOne({ email })

            if (userExist) return res.status(400).json({ errors: 'User already exists' })

            const hashedPassword = await bcrypt.hash(password, 12)

            var name = `${firstName} ${lastName}`

            if (lastName == undefined) name = firstName;

            let result = await db.get().collection(USER_COLLECTION).insertOne({ email, password: hashedPassword, name, ban: false })

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: result.insertedId })

            const token = jwt.sign({ email: result.email, id: result.insertedId.str }, 'secret', { expiresIn: "1h" })

            return res.status(200).json({ user, token })

        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    },
    signin: async (req, res) => {
        const { email, password } = req.body
        try {

            if(email == '') return res.status(404).json({ errors: ' Email Cannot be blank.' })
            
            if(password == '') return res.status(404).json({ errors: ' Password Cannot be blank.' })

            var user = await db.get().collection(collection.USER_COLLECTION).findOne({ email })

            if (!user) return res.status(404).json({ errors: 'User Not found' })

            const isPasswordCorrect = await bcrypt.compare(password, user.password)

            if (!isPasswordCorrect) return res.status(404).json({ errors: 'Invalid Password' })

            const token = jwt.sign({ email: user.email, id: user._id }, 'secret', { expiresIn: "1h" })

            res.status(200).json({ user, token })

        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    },
    sendOtp: async (req, res) => {
        const { phone } = req.body
        try {
            var userExist = await db.get().collection(collection.USER_COLLECTION).findOne({ phone })

            if (userExist) return res.status(200).send('User already exist! Try login.')

            client.verify
                .services(SERVICE_ID)
                .verifications.create({
                    to: `+91${phone}`,
                    channel: "sms"
                }).then((response) => {
                    res.status(200).json({ status: 'send' })
                })
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    },
    verifyOtp: async (req, res) => {
        const { user, otp } = req.body
        const { firstName, lastName, phone, password } = user
        try {
            client.verify
                .services(SERVICE_ID)
                .verificationChecks.create({
                    to: `+91${phone}`,
                    code: otp
                }).then(async (response) => {
                    if (response.valid) {
                        const hashedPassword = await bcrypt.hash(password, 12)

                        var name = `${firstName} ${lastName}`

                        let result = await db.get().collection(USER_COLLECTION).insertOne({ phone, password: hashedPassword, name, ban: false })

                        let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: result.insertedId })

                        const token = jwt.sign({ phone: result.phone, id: result.insertedId.str }, 'secret', { expiresIn: "1h" })

                        res.status(200).json({ user, token })
                    } else {
                        res.json({ Err: "Invalid OTP", user })
                    }
                })
        } catch (error) {
            console.log(error);
            res.json({ error: error.message })
        }
    },
    googlesign: async (req, res) => {
        const { email, firstName, lastName, password } = req.body
        try {
            var userExist = await db.get().collection(collection.USER_COLLECTION).findOne({ email })

            if (userExist) {
                var user = await db.get().collection(collection.USER_COLLECTION).findOne({ email })

                if (!user) return res.status(200).send('No account found.')

                const isPasswordCorrect = await bcrypt.compare(password, user.password)

                if (!isPasswordCorrect) return res.status(200).send('Incorrect Password')

                const token = jwt.sign({ email: user.email, id: user._id }, 'secret', { expiresIn: "1h" })

                res.status(200).json({ user, token })
            } else {
                var userExist = await db.get().collection(collection.USER_COLLECTION).findOne({ email })

                if (userExist) return res.status(200).json({ Err: 'User already exists' })

                const hashedPassword = await bcrypt.hash(password, 12)

                var name = `${firstName} ${lastName}`

                if (lastName == undefined) name = firstName;

                let result = await db.get().collection(USER_COLLECTION).insertOne({ email, password: hashedPassword, name, ban: false })

                let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: result.insertedId })

                const token = jwt.sign({ email: result.email, id: result.insertedId.str }, 'secret', { expiresIn: "1h" })

                return res.status(200).json({ user, token })
            }

        } catch (error) {
            console.log(error);
            res.json({ error: error.message })
        }
    }
}
