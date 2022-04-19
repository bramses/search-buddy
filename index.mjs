import fetch from "node-fetch";
import { parse } from "node-html-parser";
import { Configuration, OpenAIApi } from "openai";
import * as dotenv from "dotenv";
dotenv.config();
import similarity from "compute-cosine-similarity";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);
const DOC_MAX_LENGTH = 1000;
const DOC_MIN_LENGTH = 10;

// createEmbeddings is a function that takes in two arguments
// the first argument is an array of strings or a single string
// the second argument is the name of the engine you want to use
// the function returns a promise that resolves to an object
// the object contains the embeddings for the input
const createEmbeddings = async (
  input = [""] || "",
  engine = "text-search-ada-doc-001"
) => {
  const response = await openai.createEmbedding(engine, {
    input,
  });

  return response.data;
};

// filter out docs that are too short or too long
const docFilter = (doc) => {
  return doc.length > DOC_MIN_LENGTH && doc.length < DOC_MAX_LENGTH;
};

const fetchPlainText = async (url = "") => {
  if (!url) {
    console.log("No url provided");
    return [];
  }

  const response = await fetch(url);
  const html = await response.text();

  // parse the html
  const root = parse(html);
  // create an empty array
  const texts = [];
  // loop through all the p tags
  root.querySelectorAll("p").forEach((p) => {
    // push the text of the p tag into the array
    texts.push(p.text.trim());
  });

  //select all divs
  root.querySelectorAll("div").forEach((div) => {
    //push the text of each div into the texts array
    texts.push(div.text.trim());
  });

  return texts;
};

const main = async (url) => {
  try {
    const texts = await fetchPlainText(url); // fetch the plain text from the url
    const cleanedTexts = texts.filter(docFilter); // filter the text
    const embeddingsResp = await createEmbeddings(cleanedTexts); // create embeddings
    const embeddings = embeddingsResp.data; // get the embeddings

    const queryInput = ["where was lincolns son born?"];
    const queryEngine = "text-search-ada-query-001";

    // create embeddings for the query
    const queryEmbeddingResp = await createEmbeddings(queryInput, queryEngine);

    // get the embedding for the query
    const queryEmbedding = queryEmbeddingResp.data[0].embedding;

    // calculate the similarity between the query embedding and all the embeddings in the database
    const similarityResults = embeddings
      .map((embedding) => {
        embedding["similarity"] = similarity(
          queryEmbedding,
          embedding.embedding
        );
        return embedding;
      })
      .sort((a, b) => {
        return b.similarity - a.similarity;
      });

    // slice the top 3 results from the similarityResults array
    const topResults = similarityResults.slice(0, 3);
    // loop through the topResults array
    topResults.forEach((result, index) => {
      // log the index of the result and the cleanedTexts array
      console.log(`${index + 1}. ${cleanedTexts[result.index]}`);
    });
  } catch (err) {
    console.log(err);
  }
};

main("https://en.wikipedia.org/wiki/Abraham_Lincoln");
