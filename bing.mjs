import fetch from 'node-fetch'
import * as dotenv from 'dotenv'
dotenv.config()

const SUBSCRIPTION_KEY = process.env['AZURE_SUBSCRIPTION_KEY']
if (!SUBSCRIPTION_KEY) {
  throw new Error('Missing the AZURE_SUBSCRIPTION_KEY environment variable')
}

// this is a function that takes a query and returns a json object
async function bingWebSearch(query) {
    const url = `https://api.bing.microsoft.com/v7.0/search?answerCount=3&responseFilter=webpages,news&q=${query}`
    const headers = {
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
    }
    const response = await fetch(url, {
        headers
    })
    const json = await response.json()
    console.log(json)
    return json
}


/*
https.get({
    hostname: 'api.bing.microsoft.com',
    path:     '/v7.0/search?answerCount=3&responseFilter=webpages,news&q=' + encodeURIComponent(query),
    headers:  { 'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY },
  }, res => {
    let body = ''
    res.on('data', part => body += part)
    res.on('end', () => {
      for (var header in res.headers) {
        if (header.startsWith("bingapis-") || header.startsWith("x-msedge-")) {
          console.log(header + ": " + res.headers[header])
        }
      }

      const parsedBody = JSON.parse(body)

      // console.log('\nJSON Response:\n')
      // console.dir(parsedBody, { colors: false, depth: null })
      console.log(parsedBody.webPages)
      if (parsedBody.webPages) {
        console.log('\nWeb Pages Found: ' + parsedBody.webPages.value.length + '\n')
        return parsedBody.webPages
      }

      console.log('no pages found')
      return []
    })
    res.on('error', e => {
      console.log('Error: ' + e.message)
      throw e
    })
  })
*/

const fetchURLSFromBingJSON = (json) => {
    // if there is no webPages property in the json object, return null
    if (!json.webPages) {
        return null
    // if the webPages property is an empty array, return null
    }

    // otherwise, return an array of objects with the url, name, and snippet properties
    if (json.webPages.value.length === 0) {
        return null
    }

    return json.webPages.value.map(page => {
        return { url: page.url, name: page.name, snippet: page.snippet }
    })
}



const main = async (query) => {
    const res = await bingWebSearch('Promoting answers that are not ranked bing')
    console.log(fetchURLSFromBingJSON(res))
}

main()
