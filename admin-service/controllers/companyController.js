const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../config/connection')
const collection = require('../config/collection')
const {ObjectId} = require('mongodb')

module.exports = {
    getUnVerifiedCompanies :async (req,res) => {
        try {
            var unVerifiedCompanies = await db.get().collection(collection.COMPANY_COLLECTION).find({status : false}).toArray()

            res.status(200).json(unVerifiedCompanies)

        } catch (error) {
            console.log(error);
            res.status(400).json(error)
        }
    },
    getVerifiedCompanies :async (req,res) => {
        console.log("REached---------------------------");
        try {
            var verifiedCompanies = await db.get().collection(collection.COMPANY_COLLECTION).find({status : true}).toArray()

            console.log(verifiedCompanies);
            res.status(200).json(verifiedCompanies)

        } catch (error) {
            console.log(error);
            res.status(400).json(error)
        }
    },
    verifyCompany : async(req,res) => {
        var id = req.query.id  
        try {
            var verifiedCompany = await db.get().collection(collection.COMPANY_COLLECTION).updateOne({_id:ObjectId(id)},{
                $set : {
                    status : true
                }
            })
            res.status(200).json(verifiedCompany)
        } catch (error) {
            console.log(error);
            res.status(400).json(error)
        }
    },
    rejectCompany : async(req,res) => {
        var id = req.query.id  
        var {reason} = req.body
        try {
            var rejectCompany = await db.get().collection(collection.COMPANY_COLLECTION).updateOne({_id:ObjectId(id)},{
                $set : {
                    status : "Rejected",
                    reason : reason
                }
            })
            res.status(200).json(rejectCompany)
        } catch (error) {
            console.log(error);
            res.status(400).json(error)
        }
    },
}