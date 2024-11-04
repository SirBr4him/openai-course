import { openai } from './openai.js'

import readline from 'node:readline'

/**
 * readline interface
 *
 * @type {readline.Interface}
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

/**
 * Sends a new message to the OpenAI API and retrieves the assistant's reply.
 *
 * @param {Array<import('openai/resources/index.mjs').ChatCompletionMessageParam>} history - An array of message objects representing the chat history.
 * @param {import('openai/resources/index.mjs').ChatCompletionMessageParam} message - A single message object to send in the chat completion request.
 * @returns {Promise<import('openai/resources/index.mjs').ChatCompletionMessage>} - A promise that resolves with the assistant's message from the response.
 */
const newMessage = async (history, message) => {
  const resp = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [...history, message],
    temperature: 0,
  })

  return resp.choices[0].message
}

/**
 * Formats an input string as a user message object.
 *
 * @param {string} content - The input message content from the user.
 * @returns {import('openai/resources/index.mjs').ChatCompletionMessageParam} - An object representing the user message with a role and content.
 */
const formatMessage = (content) => ({ role: 'user', content })

const chat = () => {
  /**
   * An array of message objects representing the chat history.
   *
   * @type {Array<import('openai/resources/index.mjs').ChatCompletionMessageParam>}
   */
  const history = [
    {
      role: 'system',
      content:
        'You are an AI assistent expert in front-end web development usign Angular framework developed by google. Answer questions with your best knowledge!',
    },
  ]
  const start = () => {
    rl.question('You: ', async (input) => {
      if (input.toLocaleLowerCase() === 'exit') {
        rl.close()
        return
      }

      const message = formatMessage(input)
      const resp = await newMessage(history, message)

      history.push(message, resp)
      console.log(`\n\nAI: ${resp.content}\n\n`)

      start()
    })
  }

  console.log('\n\nAI: How can I help you today?\n\n')
  start()
}

console.log("Chatbot initialized. Type 'exit' to end the chat.")
chat()
