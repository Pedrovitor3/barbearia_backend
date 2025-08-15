import { FastifyInstance } from 'fastify';
import { AppDataSource } from '@/data-source';
import { Usuario } from '@/entity/Usuario';
import * as bcrypt from 'bcrypt';

export default async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/login', async (request, reply) => {
        const { username, password } = request.body as { username: string; password: string };

        const usuarioRepo = AppDataSource.getRepository(Usuario);
        const usuario = await usuarioRepo.findOne({
            where: { username }, relations: [
                'pessoa',
                'clientes',
                'clientes.empresa',
                'funcionarios',
                'funcionarios.empresa',
                'administradores'
            ]
        });
        if (!usuario) {
            return reply.status(401).send({ message: 'Credenciais inválidas' });
        }

        const senhaValida = await bcrypt.compare(password, usuario.senhaHash);
        if (!senhaValida) {
            return reply.status(401).send({ message: 'Credenciais inválidas' });
        }

        const access_token = fastify.jwt.sign(
            { usuarioId: usuario.usuarioId, username: usuario.username },
            { expiresIn: '1h' }
        );

        return {
            access_token: access_token,
            usuario: usuario
        };
    });
}
