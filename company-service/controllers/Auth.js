const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../config/connection')
const collection = require('../config/collection')
const { json } = require('body-parser')
const { ObjectId } = require('mongodb')
const { validationResult } = require('express-validator')


module.exports = {
    registerCompany:async(req,res) => {
        const {email} = req.body
        const companyDetails = req.body
        var errors = validationResult(req)

        //Register Company
        try {

            //Express Validator error.
            if (!errors.isEmpty()) {
               return res.status(400).json({ errors: errors.array() })
            }

            var companyExist = await db.get().collection(collection.COMPANY_COLLECTION).findOne({email})

            if(companyExist) return res.status(400).json({error : 'Company already exists'})

            companyDetails.password = await bcrypt.hash(companyDetails.password,10)

            let result =await db.get().collection(collection.COMPANY_COLLECTION).insertOne({...companyDetails})

            let company = await db.get().collection(collection.COMPANY_COLLECTION).findOne({_id:result.insertedId})

            const token = jwt.sign({email:result.email,id:result.insertedId.str},'secret',{expiresIn:"1h"})

            res.status(200).json({company,token})
        } catch (error) {
            console.log(error);
            res.status(500).json({error:error.message})
        }
    },
    //Login company
    loginCompany : async(req,res) => {
        const {email,password} = req.body

        try {

            const company = await db.get().collection(collection.COMPANY_COLLECTION).findOne({email})

            if(!company) return res.status(400).json({error : 'Company not found'})

            const isPasswordCorrect = await bcrypt.compare(password,company.password)

            if(!isPasswordCorrect) return res.status(400).json({error : 'Incorrect Password'})

            const token = jwt.sign({email:company.email,id:company._id.str},'secret',{expiresIn:"1h"})

            res.status(200).json({company,token})
            
        } catch (error) {
            res.status(500).json({error:error.message})
        }
    },
    //Reregister company
    reregisterCompany : async (req,res) => {
        const id = req.query.id
        const {email} = req.body
        const companyDetails = req.body
        try {
            var updatedCompany = await db.get().collection(collection.COMPANY_COLLECTION).updateOne({ _id: ObjectId(id)} , {
                $set : {
                    companyName : companyDetails.companyName,
                    industry : companyDetails.industry,
                    email : companyDetails.email,
                    location : companyDetails.location,
                    phone : companyDetails.phone,
                    bio : companyDetails.bio,
                    website : companyDetails.website,
                    linkedIn : companyDetails.linkedIn,
                    facebook : companyDetails.facebook,
                    twitter : companyDetails.twitter,
                    instagram : companyDetails.instagram,
                    status : false,
                    imgUrl : companyDetails.imgUrl,
                    ban : false
                },
                $unset : {
                    reason : ""
                }
            })
            var company = await db.get().collection(collection.COMPANY_COLLECTION).findOne({_id : ObjectId(id)})
            res.status(200).json({company})
        } catch (error) {
            res.status(500).json({error:error.message})
        }
    }
}