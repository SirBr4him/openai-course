import 'dotenv/config'

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { YoutubeLoader } from '@langchain/community/document_loaders/web/youtube'
import { OpenAIEmbeddings } from '@langchain/openai'
import { CharacterTextSplitter } from 'langchain/text_splitter'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { openai } from './openai.js'

const question = process.argv[2] || 'hi'
const video = `https://youtu.be/zR_iuq2evXo?si=cG8rODgRgXOx9_Cn`
const pdf = 'xbox.pdf'

export const createStore = (docs) =>
  MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings())

const docsFromYTVideo = async (url) => {
  const splitter = new CharacterTextSplitter({
    separator: ' ',
    chunkSize: 2500,
    chunkOverlap: 100,
  })
  const loader = YoutubeLoader.createFromUrl(url, {
    language: 'en',
    addVideoInfo: true,
  })
  return splitter.splitDocuments(await loader.load())
}

const docsFromPDF = async (filePath) => {
  const splitter = new CharacterTextSplitter({
    separator: '. ',
    chunkSize: 2500,
    chunkOverlap: 200,
  })

  const loader = new PDFLoader(filePath)

  return splitter.splitDocuments(await loader.load())
}

const loadStore = async () => {
  const videoDocs = await docsFromYTVideo(video)
  const pfdDocs = await docsFromPDF(pdf)

  return createStore([...videoDocs, ...pfdDocs])
}

const query = async () => {
  const store = await loadStore()
  const res = await store.similaritySearch(question, 2)

  const resp = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful AI assistant. Answar questions to your best ability.',
      },
      {
        role: 'user',
        content: `Answer the following question using the provided context. If you cannot answer the question with the context, don't lie and make up stuff. Just say you need more context.
          Question: ${question}
    
          Context: ${res.map((r) => r.pageContent).join('\n')}`,
      },
    ],
  })

  console.log(
    `Answer: ${resp.choices[0].message.content}\n\nSources: ${res
      .map((r) => r.metadata.source)
      .join(', ')}`
  )
}

query()
