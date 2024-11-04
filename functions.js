import math from 'advanced-calculator'
import { openai } from './openai.js'

const QUESTION =
  process.argv[2] || '1 + sin(4/2) / 3 ^ 3 -1 * 3 + pi + max(3,2) % log(24)'

const functions = {
  async calculate({ expression }) {
    return math.evaluate(expression)
  },
  async generateImage({ prompt }) {
    const result = await openai.images.generate({ prompt })
    console.log(prompt)
    console.log(result)
    return result.data[0].url
  },
}

const getCompletion = (messages) => {
  return openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0,
    functions: [
      {
        name: 'calculate',
        description: 'Run math expressions',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description:
                'Then math expression to evaluate like "2 * 3 + (21 / 2) ^ 2"',
            },
          },
          required: ['expression'],
        },
      },
      {
        name: 'generateImage',
        description: 'Create or generate image based on a description',
        parameters: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The description of the image to generate',
            },
          },
          required: ['prompt'],
        },
      },
    ],
  })
}

const messages = [
  {
    role: 'user',
    content: QUESTION,
  },
]

const start = async () => {
  const resp = await getCompletion(messages)

  if (resp.choices[0].finish_reason === 'stop') {
    console.log(resp.choices[0].message.content)
  } else if (resp.choices[0].finish_reason === 'function_call') {
    const call = resp.choices[0].message.function_call

    const funcToCall = functions[call.name]
    const params = JSON.parse(call.arguments)
    const results = await funcToCall(params)

    messages.push({
      role: 'assistant',
      content: null,
      function_call: { name: call.name, arguments: call.arguments },
    })

    messages.push({
      role: 'function',
      name: call.name,
      content: JSON.stringify({ results }),
    })

    start()
  }
}

start()
