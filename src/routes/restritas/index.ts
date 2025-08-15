import { FastifyInstance } from 'fastify';

import empresaRoutes from '@/routes/restritas/empresa';
import funcionarioRoutes from '@/routes/restritas/funcionario';
import usuarioRoutes from '@/routes/restritas/usuario';
import pessoaRoutes from '@/routes/restritas/pessoas';

export default async function rotasRestritas(fastify: FastifyInstance) {
    await fastify.register(pessoaRoutes);
    await fastify.register(usuarioRoutes);
    await fastify.register(empresaRoutes);
    await fastify.register(funcionarioRoutes);
}