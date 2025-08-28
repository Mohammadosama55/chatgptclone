import { NextRequest, NextResponse } from 'next/server'

// Simple AI response simulation - replace with your preferred AI service
// To integrate real AI services, you can:
// 1. OpenAI: Add openai package and use GPT-3.5/GPT-4
// 2. Anthropic: Add @anthropic-ai/sdk for Claude
// 3. Google: Add @google/generative-ai for Gemini
// 4. Local models: Add ollama or other local AI solutions
function generateAIResponse(message: string): string {
  // Check if user is asking about identity
  const identityQuestions = [
    'who are you',
    'what are you',
    'what is your name',
    'what should I call you',
    'introduce yourself',
    'tell me about yourself'
  ]

  const isIdentityQuestion = identityQuestions.some(q => 
    message.toLowerCase().includes(q)
  )

  if (isIdentityQuestion) {
    return 'Hello! I am ChatAI, your helpful AI assistant. I\'m here to help you with questions, provide information, and have conversations. How can I assist you today?'
  }

  // Simple response patterns based on message content
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return 'Hello! How can I help you today?'
  }
  
  if (lowerMessage.includes('how are you')) {
    return 'I\'m doing well, thank you for asking! How are you doing?'
  }
  
  if (lowerMessage.includes('weather')) {
    return 'I don\'t have access to real-time weather data, but I\'d recommend checking a weather app or website for current conditions in your area.'
  }
  
  if (lowerMessage.includes('time')) {
    return 'I don\'t have access to real-time data, but you can check the current time on your device or search for world clocks online.'
  }
  
  if (lowerMessage.includes('help')) {
    return 'I\'m here to help! You can ask me questions about various topics, and I\'ll do my best to provide helpful information and responses.'
  }
  
  // Default helpful response
  return `Thank you for your message: "${message}". I understand you\'re interested in this topic. While I\'m a simple AI assistant, I\'m here to help with questions and provide information. Is there something specific you\'d like to know more about?`
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    console.log('Received message:', message)

    // Generate AI response using simple fallback system
    const response = generateAIResponse(message)

    console.log('AI Response:', response)

    return NextResponse.json({
      response,
      conversationId
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}