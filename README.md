# ChatAI - Real-time Chat Application

A modern real-time chat application built with Next.js, Socket.IO, and Prisma. Features include user authentication, real-time messaging, and a clean, responsive interface.

## Features

- **Real-time messaging** - Instant message delivery using Socket.IO
- **User authentication** - Secure login and registration system
- **Responsive design** - Works seamlessly on desktop and mobile devices
- **Message history** - Persistent chat conversations stored in database
- **Modern UI** - Clean interface built with Tailwind CSS and Radix UI
- **Type-safe** - Full TypeScript implementation

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Node.js, Socket.IO
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with bcrypt
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chatAi
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` and configure your database and authentication settings.

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes
- `npm run db:generate` - Generate Prisma client

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── api/            # API routes
│   │   ├── auth/       # Authentication endpoints
│   │   ├── chat/       # Chat API endpoints
│   │   └── conversations/ # Conversation management
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── auth/          # Authentication components
│   └── ui/            # Reusable UI components
├── hooks/             # Custom React hooks
└── lib/               # Utility functions and configs
    ├── db.ts          # Database connection
    ├── socket.ts      # Socket.IO setup
    └── utils.ts       # Helper utilities
```

## Database Schema

The application uses a SQLite database with the following main entities:

- **Users** - User accounts with authentication
- **Conversations** - Chat conversation rooms
- **Messages** - Individual chat messages

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide React](https://lucide.dev/)
