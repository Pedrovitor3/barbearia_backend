import { FastifyInstance } from 'fastify';
import { AppDataSource } from '@/data-source';
import { Usuario } from '@/entity/Usuario';
import { UsuarioController } from '@/controllers/UsuarioController';

export default async function usuarioRoutes(fastify: FastifyInstance) {
    fastify.get('/profile', { preHandler: [fastify.authenticate] }, async (request, _reply) => {
        return { message: 'Rota protegida', user: request.user };
    });

    fastify.get('/usuarios', { preHandler: [fastify.authenticate] }, async (_request, reply) => {
        const usuarioRepository = AppDataSource.getRepository(Usuario);
        try {
            const usuarios = await usuarioRepository.find({ relations: ['pessoa'] });
            return reply.status(200).send(usuarios);
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ message: 'Erro ao buscar usuários', error });
        }
    });

    fastify.post('/usuario', async (request, reply) => {
        try {
            const usuario = await UsuarioController.criarUsuario(request.body as any);
            return reply.status(201).send(usuario);
        } catch (error) {
            return reply.status(400).send({ message: 'Erro ao criar usuário', error });
        }
    });
}
