const { ObjectId, MongoClient } = require('mongodb'); 
const DataLoader = require('dataloader');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { graphqlHTTP } = require('express-graphql');
const url = 'mongodb://localhost:27017';
const dbName = 'ee547Project';
const axios = require('axios');
const express = require('express')

const app = express()
const PORT = 3000;

const bearer_token = 'LGS-Lo6Z3Nvd_RZv25i10Jzo0CpsvmjzWGMLI49Gbo_ifwYo2Uf7qFqq0QonC5lXCbZ6w-C2TSx7RMvc7aUr8l-Zhx0AOT07227CepGyAOOyyLedRy19zQTHyAGHY3Yx';
const latitude1 = 37.786882;
const longitude1 = -122.399972;
const latitude2 = 37.76131;
const longitude2 = -122.42431;

const File = './config/mongo.json';

const typeDefs = `type Query {
  business(bid: ID!):   Business
}

type Mutation {
  businessCreate(
    businessInput: BusinessCreateInput
  ): Business
}

input BusinessCreateInput {
  bname:                String
  bid:                  String
  categories:           Categories
  url:                  String
}

type Business {
  id:                   String
  alias:                String
  name:                 String
  image_url:            String
  is_closed:            String
  url:                  String
  review_count:         String
  categories:           Categories
  rating:               Float
  coordinate:           Coordinates
  price:                String
  location:             Location
  phone:                String
  display_phone:        String
  distance:             Float
}

type Categories {
  title:                String
  alias:                String
}

type Coordinates {
  latitude:             String
  longitude:            String
}

type Transactions {

}
`


const kErrors = {
  kNotFoundError: class kNotFoundError extends Error {},
  kInActiveMatch: class kInActiveMatch extends Error {},
  kInsufficientFunds: class kInSufficientFunds extends Error {},
  kMatchNotActive: class kMatchNotActive extends Error {}
}

async function getBusinessDetails() {
  let config1 = {
    method: 'get',
    url: `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${latitude1}&longitude=${longitude1}`,
    headers: {
      'Authorization': `Bearer ${bearer_token}`
    }
  };
  let response = await axios(config1);
  let new_business = response.data.businesses.map(obj => {return obj});
  return new_business
}

class Database {
  constructor(client) {
      this.client = client;
  }

  async _connect() {
      try {
          await this.client.connect();
          return true;
      }
      catch {
          process.exit(5);
      }
  }
}

let config = {
  'host': 'mongodb',
  'port': '27017',
  'db': 'ee547project',
  'opts': {
      'useUnifiedTopology': true
  },
  "business_collection": "businesses",
}

try {
  let conf = require(File);
  config = {...this.config, ...conf}
}
catch {}

let mongo_url = `mongodb://${config.host}:${config.port}`
let client = new MongoClient(mongo_url, config.opts);
let db = new Database(client)._connect();

async function addToMongo() {
  let business = await getBusinessDetails()
  let obj = {
    'business': business
  }
  let insertion_b = await db.collection('business_collection').insertOne(obj)
  if (insertion_b.insertedId) {
    return true
  }
  else {
    return false
  }
}

addToMongo()

// const typeDefs = fs.readFileSync("/Users/aditibodhankar/Documents/Fall 2022/EE 547/Project/schema-v2.graphql").toString("utf-8");

const resolvers = {
  Query: {
    businesses: async (_, {bid}, context) => {
      return context.loaders.businesses.load(bid);
    },
  },

  Mutation: {
    businessCreate: async (_, {businessInput: {bname, bid, categories, url}}, context) => {
      let business = {
        bname:bname,
        bid: bid,
        categories: categories, 
        url: url
      }

      let insert_business = await context.db.collection(config.business_collection).insertOne(business);
      return insert_business
    },
  }
} 

const schema = makeExecutableSchema({
  resolvers,
  resolverValidationOptions: {
    requireResolversForAllFields: "ignore",
    requireResolversToMatchSchema: "ignore",
  },
  typeDefs,
});

app.get("/ping", (req, res) => {
  res.sendStatus(204); 
});

app.use(
  "/graphql",
  graphqlHTTP(async (req) => {
    console.log("req");
    return {
      schema,
      graphiql: true,
      context: {
        db: db,
        loaders: {
          Business: new DataLoader((keys) => getbusiness(db, keys)),
        },
      },
    };
  })
)

async function getbusiness(db, keys) {
  // SHOULD PARAMETERIZE THE QUERY
  keys = keys.map(key => ObjectId[key]);
  let businesses = await db.collection("businesses").find({_id: {$in: keys}}).toArray();
  return keys.map(key => businesses.find(elem => elem.bid == key.toString()) || new Error(`Businesses [${key}] do not exist`));
}
