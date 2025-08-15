// src/server.ts
import fastify from 'fastify'
import cors from '@fastify/cors'
import jwtPlugin from '@/plugins/jwt'
import { AppDataSource } from '@/data-source'
import 'dotenv/config'
import routes from '@/routes/router'

const app = fastify({ logger: true })

// CORS antes de tudo
app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})

// JWT
app.register(jwtPlugin)

// Rotas
app.register(routes)

const start = async () => {
    try {
        await AppDataSource.initialize()
        app.log.info('Conexão com banco estabelecida!')
        const porta = Number(process.env.PORT) || 3000
        await app.listen({ port: porta, host: '0.0.0.0' })
        console.log('Server rodando na porta ' + porta)
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

start()