import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log('Fetching all conversations...')
    const conversations = await db.conversation.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    console.log('Found conversations:', conversations.length)
    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, userId } = await request.json()

    console.log('Creating conversation with title:', title, 'userId:', userId)

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Use provided userId or create a default user
    let finalUserId = userId
    
    if (!finalUserId) {
      // First try to find an existing default user
      let defaultUser = await db.user.findFirst({
        where: { email: 'default@example.com' }
      })

      if (!defaultUser) {
        defaultUser = await db.user.create({
          data: {
            email: 'default@example.com',
            name: 'Default User',
            password: 'defaultpassword' // This should be hashed in production
          }
        })
        console.log('Created default user:', defaultUser.id)
      }
      
      finalUserId = defaultUser.id
    }

    const conversation = await db.conversation.create({
      data: {
        title,
        userId: finalUserId
      },
      include: {
        messages: true
      }
    })

    console.log('Created conversation:', conversation.id)
    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}