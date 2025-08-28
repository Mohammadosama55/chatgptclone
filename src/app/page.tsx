'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Send, Plus, Trash2, Bot, User, Copy, Check, 
  Sparkles, MessageCircle, Settings, Moon, Sun,
  Zap, Star, LogIn, LogOut
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSocket } from '@/hooks/use-socket'
import AuthModal from '@/components/auth/AuthModal'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: Date
}

interface Conversation {
  id: string
  title: string
  createdAt: Date
  messages: Message[]
}

interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Check for existing user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('chatgkm-user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setCurrentUser(user)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('chatgkm-user')
      }
    }
  }, [])

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      console.log('Attempting to copy text:', text.substring(0, 50) + '...')
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        console.log('Copied using modern clipboard API')
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        try {
          const successful = document.execCommand('copy')
          document.body.removeChild(textArea)
          
          if (!successful) {
            throw new Error('execCommand failed')
          }
          console.log('Copied using fallback method')
        } catch (execError) {
          document.body.removeChild(textArea)
          throw execError
        }
      }
      
      setCopiedMessageId(messageId)
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
        variant: "default",
      })
      
      setTimeout(() => {
        setCopiedMessageId(null)
      }, 2000)
    } catch (error) {
      console.error('Copy failed:', error)
      
      try {
        const success = window.prompt(
          'Copy failed manually. Please copy the text below:', 
          text
        )
        if (success !== null) {
          toast({
            title: "Manual Copy",
            description: "Text shown in prompt for manual copying",
            variant: "default",
          })
        }
      } catch (promptError) {
        toast({
          title: "Copy Failed",
          description: "Unable to copy message. Please select and copy manually.",
          variant: "destructive",
        })
      }
    }
  }

  const socket = useSocket({
    onMessage: (message) => {
      if (message.conversationId === currentConversation?.id) {
        const newMessage: Message = {
          id: message.id,
          content: message.content,
          role: message.role,
          createdAt: new Date(message.timestamp)
        }
        
        setCurrentConversation(prev => {
          if (!prev) return null
          return {
            ...prev,
            messages: [...prev.messages, newMessage]
          }
        })
        
        if (message.role === 'assistant') {
          setIsLoading(false)
        }
      }
    },
    onConversationCreated: (conversation) => {
      const newConversation: Conversation = {
        id: conversation.id,
        title: conversation.title,
        createdAt: new Date(conversation.createdAt),
        messages: []
      }
      setConversations(prev => [newConversation, ...prev])
    },
    onConversationDeleted: (conversationId) => {
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
      }
    },
    onUserTyping: (data) => {
      if (data.conversationId === currentConversation?.id) {
        setIsTyping(data.isTyping)
      }
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages])

  useEffect(() => {
    const loadConversations = async () => {
      try {
        console.log('Loading conversations...')
        const response = await fetch('/api/conversations')
        if (response.ok) {
          const data = await response.json()
          console.log('Loaded conversations:', data)
          const formattedConversations = data.map((conv: any) => ({
            id: conv.id,
            title: conv.title,
            createdAt: new Date(conv.createdAt),
            messages: conv.messages.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              role: msg.role,
              createdAt: new Date(msg.createdAt)
            }))
          }))
          setConversations(formattedConversations)
        } else {
          console.error('Failed to load conversations:', response.status)
        }
      } catch (error) {
        console.error('Failed to load conversations:', error)
      }
    }

    if (currentUser) {
      loadConversations()
    }
  }, [currentUser])

  const createNewConversation = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true)
      return
    }

    try {
      console.log('Creating new conversation...')
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Conversation'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Created conversation:', data)
        const newConversation: Conversation = {
          id: data.id,
          title: data.title,
          createdAt: new Date(data.createdAt),
          messages: []
        }
        
        socket.createConversation({ title: 'New Conversation' })
        
        setConversations(prev => [newConversation, ...prev])
        setCurrentConversation(newConversation)
      } else {
        console.error('Failed to create conversation:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      })
    }
  }

  const deleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        socket.deleteConversation(id)
        
        setConversations(prev => prev.filter(conv => conv.id !== id))
        if (currentConversation?.id === id) {
          setCurrentConversation(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      })
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation || isLoading) return

    console.log('Sending message:', inputMessage)

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      createdAt: new Date()
    }

    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      title: currentConversation.messages.length === 0 ? inputMessage.slice(0, 50) + '...' : currentConversation.title
    }

    setCurrentConversation(updatedConversation)
    setConversations(prev => 
      prev.map(conv => conv.id === currentConversation.id ? updatedConversation : conv)
    )

    setInputMessage('')
    setIsLoading(true)

    try {
      console.log('Saving user message to database...')
      const messageResponse = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: inputMessage,
          role: 'user'
        }),
      })

      if (!messageResponse.ok) {
        throw new Error('Failed to save message to database')
      }

      if (currentConversation.messages.length === 0) {
        console.log('Updating conversation title...')
        await fetch(`/api/conversations/${currentConversation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: inputMessage.slice(0, 50) + '...'
          }),
        })
      }

      socket.sendMessage({
        message: inputMessage,
        conversationId: currentConversation.id
      })

      console.log('Calling AI API...')
      const aiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationId: currentConversation.id
        }),
      })

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text()
        console.error('AI API failed:', aiResponse.status, errorText)
        throw new Error('Failed to get AI response')
      }

      const data = await aiResponse.json()
      console.log('AI response received:', data)
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.response,
        role: 'assistant',
        createdAt: new Date()
      }

      console.log('Saving assistant message to database...')
      const assistantMessageResponse = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: data.response,
          role: 'assistant'
        }),
      })

      if (!assistantMessageResponse.ok) {
        console.error('Failed to save assistant message to database')
      }

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage]
      }

      setCurrentConversation(finalConversation)
      setConversations(prev => 
        prev.map(conv => conv.id === currentConversation.id ? finalConversation : conv)
      )
    } catch (error: any) {
      console.error('Error in sendMessage:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to get response from AI",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value)
    if (currentConversation) {
      socket.sendTyping({
        conversationId: currentConversation.id,
        isTyping: e.target.value.length > 0
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('chatgkm-user')
    setCurrentUser(null)
    setConversations([])
    setCurrentConversation(null)
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
      variant: "default",
    })
  }

  useEffect(() => {
    if (currentConversation) {
      socket.joinConversation(currentConversation.id)
    }
    
    return () => {
      if (currentConversation) {
        socket.leaveConversation(currentConversation.id)
      }
    }
  }, [currentConversation?.id])

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 text-gray-900'}`}>
      {/* Header */}
      <header className={`backdrop-blur-lg border-b ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-purple-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg opacity-75 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ChatGKM
                </h1>
              </div>
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200">
                <Zap className="h-3 w-3 mr-1" />
                Zhipu AI
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-100'}`}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-100'}`}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-100'}`}
              >
                <Settings className="h-4 w-4" />
              </Button>

              {currentUser ? (
                <div className="flex items-center space-x-2">
                  <div className="text-sm">
                    <span className={`font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                      {currentUser.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-100'}`}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAuthModalOpen(true)}
                  className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-100'}`}
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-0'} ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-r ${isDarkMode ? 'border-gray-700' : 'border-purple-200'} flex flex-col`}>
          {isSidebarOpen && (
            <>
              <div className="p-4">
                <Button 
                  onClick={createNewConversation} 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </div>
              
              <ScrollArea className="flex-1 px-4 pb-4">
                <div className="space-y-3">
                  {conversations.map((conversation) => (
                    <Card 
                      key={conversation.id} 
                      className={`group cursor-pointer transition-all duration-200 hover:shadow-md ${
                        currentConversation?.id === conversation.id 
                          ? (isDarkMode ? 'bg-purple-900/30 border-purple-500' : 'bg-purple-100 border-purple-300') 
                          : (isDarkMode ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100')
                      }`}
                      onClick={() => setCurrentConversation(conversation)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <Star className="h-3 w-3 text-purple-400" />
                              <h3 className="font-medium text-sm truncate">{conversation.title}</h3>
                            </div>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {conversation.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteConversation(conversation.id)
                            }}
                            className={`${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} opacity-0 group-hover:opacity-100 transition-all duration-200`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {!currentUser ? (
            /* Auth Required Screen */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                    <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-8 rounded-full">
                      <Sparkles className="h-16 w-16 text-white" />
                    </div>
                  </div>
                </div>
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Welcome to ChatGKM
                </h2>
                <p className="text-lg mb-8 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Sign in to start your AI journey
                </p>
                <div className="space-y-4">
                  <Button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In to ChatGKM
                  </Button>
                  <div className="text-sm text-gray-500">
                    Don't have an account? Sign up for free!
                  </div>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 gap-4 mt-8">
                  <Card className={`p-4 text-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-200'} shadow-lg`}>
                    <div className="flex justify-center mb-2">
                      <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-2 rounded-full">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold mb-1">AI Intelligence</h3>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Powered by advanced AI models
                    </p>
                  </Card>

                  <Card className={`p-4 text-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-200'} shadow-lg`}>
                    <div className="flex justify-center mb-2">
                      <div className="bg-gradient-to-r from-blue-400 to-cyan-400 p-2 rounded-full">
                        <MessageCircle className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold mb-1">Real-time Chat</h3>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Instant responses with real-time messaging
                    </p>
                  </Card>

                  <Card className={`p-4 text-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-200'} shadow-lg`}>
                    <div className="flex justify-center mb-2">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-400 p-2 rounded-full">
                        <Copy className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold mb-1">Easy Copy</h3>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      One-click copy functionality
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          ) : !currentConversation ? (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                      <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-8 rounded-full">
                        <Sparkles className="h-16 w-16 text-white" />
                      </div>
                    </div>
                  </div>
                  <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                    Welcome to ChatGKM
                  </h2>
                  <p className="text-xl mb-8 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Your intelligent AI companion powered by Zhipu AI
                  </p>
                  <Button 
                    onClick={createNewConversation}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Start Your First Conversation
                  </Button>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                  <Card className={`p-6 text-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-200'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-3 rounded-full">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">AI Intelligence</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Powered by advanced AI models for intelligent conversations
                    </p>
                  </Card>

                  <Card className={`p-6 text-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-200'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-r from-blue-400 to-cyan-400 p-3 rounded-full">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Real-time Chat</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Instant responses with real-time messaging capabilities
                    </p>
                  </Card>

                  <Card className={`p-6 text-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-200'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-400 p-3 rounded-full">
                        <Copy className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Easy Copy</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      One-click copy functionality for all your conversations
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            /* Chat Interface */
            <>
              {/* Chat Header */}
              <div className={`p-4 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-2 rounded-full">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{currentConversation.title}</h3>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {currentConversation.messages.length} messages
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className={`${isDarkMode ? 'bg-gray-700' : 'bg-purple-100'} ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                      Active
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  {currentConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div className={`flex gap-4 max-w-[70%] ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}>
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            message.role === 'user' 
                              ? 'bg-gradient-to-r from-blue-400 to-cyan-400' 
                              : 'bg-gradient-to-r from-purple-400 to-pink-400'
                          }`}>
                            {message.role === 'user' ? (
                              <User className="h-5 w-5 text-white" />
                            ) : (
                              <Bot className="h-5 w-5 text-white" />
                            )}
                          </div>
                        </div>
                        
                        <div className="relative group">
                          <Card className={`${message.role === 'user' 
                            ? (isDarkMode ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-100 border-blue-300') 
                            : (isDarkMode ? 'bg-purple-900/30 border-purple-500' : 'bg-purple-100 border-purple-300')
                          } backdrop-blur-sm`}>
                            <CardContent className="p-4 pr-12">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              <div className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {message.createdAt.toLocaleTimeString()}
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                              message.role === 'user' 
                                ? (isDarkMode ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300' : 'bg-blue-200 hover:bg-blue-300 text-blue-600')
                                : (isDarkMode ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300' : 'bg-purple-200 hover:bg-purple-300 text-purple-600')
                            }`}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              copyToClipboard(message.content, message.id)
                            }}
                            title="Copy message"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex gap-4 justify-start">
                      <div className="flex gap-4 max-w-[70%]">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-400 to-pink-400">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <Card className={`${isDarkMode ? 'bg-purple-900/30 border-purple-500' : 'bg-purple-100 border-purple-300'} backdrop-blur-sm`}>
                          <CardContent className="p-4">
                            <div className="flex gap-1">
                              <Skeleton className="h-2 w-2 rounded-full animate-pulse" />
                              <Skeleton className="h-2 w-2 rounded-full animate-pulse" />
                              <Skeleton className="h-2 w-2 rounded-full animate-pulse" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                  
                  {isLoading && (
                    <div className="flex gap-4 justify-start">
                      <div className="flex gap-4 max-w-[70%]">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-400 to-pink-400">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <Card className={`${isDarkMode ? 'bg-purple-900/30 border-purple-500' : 'bg-purple-100 border-purple-300'} backdrop-blur-sm`}>
                          <CardContent className="p-4">
                            <div className="flex gap-1">
                              <Skeleton className="h-2 w-2 rounded-full animate-pulse" />
                              <Skeleton className="h-2 w-2 rounded-full animate-pulse" />
                              <Skeleton className="h-2 w-2 rounded-full animate-pulse" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className={`p-6 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-200'}`}>
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type your message..."
                        value={inputMessage}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        disabled={!currentConversation || isLoading}
                        className={`w-full pl-4 pr-12 py-3 rounded-full border-0 shadow-lg ${
                          isDarkMode 
                            ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-purple-500' 
                            : 'bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-purple-500'
                        } focus:outline-none focus:ring-2 transition-all duration-200`}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-1 rounded-full">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={sendMessage} 
                      disabled={!inputMessage.trim() || !currentConversation || isLoading}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className={`text-xs mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Press Enter to send • Shift+Enter for new line
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  )
}