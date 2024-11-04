import 'dotenv/config'

import { OpenAIEmbeddings } from '@langchain/openai'
import { Document } from 'langchain/document'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { movies } from './data.js'

const createStore = () =>
  MemoryVectorStore.fromDocuments(
    movies.map(
      (m) =>
        new Document({
          pageContent: `Title: ${m.title}, ${m.description}`,
          metadata: { source: m.id, title: m.title },
        })
    ),
    new OpenAIEmbeddings()
  )

const search = async (query, count = 1) => {
  const store = await createStore()
  return store.similaritySearch(query, count)
}

console.log(await search('a movie that will make me feel like I am crazy'))
