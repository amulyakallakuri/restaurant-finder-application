const { visitResult } = require('@graphql-tools/utils');
const axios = require('axios');
// const { MongoClient } = require('mongodb')
var MongoClient = require('mongodb').MongoClient;
const express = require('express')

const app = express()

const bearer_token = 'LGS-Lo6Z3Nvd_RZv25i10Jzo0CpsvmjzWGMLI49Gbo_ifwYo2Uf7qFqq0QonC5lXCbZ6w-C2TSx7RMvc7aUr8l-Zhx0AOT07227CepGyAOOyyLedRy19zQTHyAGHY3Yx';
const latitude1 = 37.786882;
const longitude1 = -122.399972;
const latitude2 = 37.76131;
const longitude2 = -122.42431;
const businessid1 = 'YqvoyaNvtoC8N5dA8pD2JA';


async function getBusinessDetails() {
  let config1 = {
    method: 'get',
    url: `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${latitude1}&longitude=${longitude1}`,
    headers: {
      'Authorization': `Bearer ${bearer_token}`
    }
  };
  let response = await axios(config1);
  let ids = response.data.businesses.map(obj => {return obj});
  return ids;
}

async function saveDetails() {
  business_collection = await getBusinessDetails();
  console.log(business_collection);
  // Connect to the db
    MongoClient.connect("mongodb://127.0.0.1:27017/aditiMongo", function (err, db) { 
  if(err){
    console.log(err);
    console.log("Failed to connect to mongodb")
  }else
  {
    console.log("Connected to Mongo DB")
    db.collection('testMongo', function (err, collection) {
      if(err){
        console.log(err);
      }
      collection.deleteMany({});
    });
    db.collection('testMongo', function (err, collection) {
      if(err){
        console.log(err);
      }
      collection.insertMany(business_collection);
      db.collection('testMongo').count(function (err, count) {
        if (err) throw err;
        console.log('Total Rows: ' + count);
      });
    });
  }});
}

saveDetails();
