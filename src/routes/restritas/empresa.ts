import { FastifyInstance } from 'fastify';
import { EmpresaController } from '@/controllers/EmpresaController';

interface AuthenticatedUser {
    usuarioId: number;
    pessoaId: number;
}

export default async function empresaRoutes(fastify: FastifyInstance) {
    fastify.get('/empresas', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            const usuario = request.user as AuthenticatedUser;
            const empresas = await EmpresaController.listarEmpresasVinculadas(usuario);
            return reply.status(200).send(empresas);
        } catch (error) {
            return reply.status(500).send({ message: 'Erro ao buscar empresas', error });
        }
    });

    fastify.post('/empresa', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            const usuario = request.user as AuthenticatedUser;
            const empresa = await EmpresaController.criarEmpresa(request.body as any, usuario);
            return reply.status(201).send(empresa);
        } catch (error: any) {
            return reply.status(error.status || 400).send({ message: error.message || 'Erro ao criar empresa', error });
        }
    });

    fastify.put('/empresa/:empresa_id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            const usuario = request.user as AuthenticatedUser;
            const empresaId = Number((request.params as { empresa_id: string }).empresa_id);
            const empresa = await EmpresaController.editarEmpresa(empresaId, request.body as any, usuario);
            return reply.status(200).send(empresa);
        } catch (error: any) {
            return reply.status(error.status || 400).send({ message: error.message || 'Erro ao editar empresa', error });
        }
    });
}
