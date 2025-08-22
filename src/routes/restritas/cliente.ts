import { FastifyInstance } from "fastify";
import { ClienteController } from "@/controllers/ClienteController";

interface AuthenticatedUser {
  usuarioId: number;
  pessoaId: number;
}
interface ListarClienteBody {
  empresaId: number;
}
export default async function clienteRoutes(fastify: FastifyInstance) {
  // Listar todos os clientes vinculados ao usuário
  fastify.get(
    "/clientes",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const clientes =
          await ClienteController.listarClientesVinculados(usuario);
        return reply.status(200).send(clientes);
      } catch (error: any) {
        return reply
          .status(error.status || 500)
          .send({ message: error.message || "Erro ao buscar clientes", error });
      }
    }
  );

  // Listar clientes por empresa
  fastify.get(
    "/empresa/:empresa_id/clientes",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const empresaId = Number(
          (request.params as { empresa_id: string }).empresa_id
        );
        const clientes = await ClienteController.listarClientesPorEmpresa(
          empresaId,
          usuario
        );
        return reply.status(200).send(clientes);
      } catch (error: any) {
        return reply.status(error.status || 400).send({
          message: error.message || "Erro ao buscar clientes da empresa",
          error,
        });
      }
    }
  );

  // Buscar cliente específico
  fastify.get(
    "/cliente/:cliente_id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const clienteId = Number(
          (request.params as { cliente_id: string }).cliente_id
        );
        const cliente = await ClienteController.listarCliente(
          clienteId,
          usuario,
          true
        );

        if (!cliente) {
          return reply
            .status(404)
            .send({ message: "Cliente não encontrado ou acesso negado" });
        }

        return reply.status(200).send(cliente);
      } catch (error: any) {
        return reply
          .status(error.status || 400)
          .send({ message: error.message || "Erro ao buscar cliente", error });
      }
    }
  );

  // Criar novo cliente
  fastify.post<{ Body: ListarClienteBody }>(
    "/cliente",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const body = request.body;
        const empresaId = body?.empresaId;
        const cliente = await ClienteController.listarClientesPorEmpresa(
          empresaId,
          usuario
        );
        return reply.status(201).send(cliente);
      } catch (error: any) {
        return reply
          .status(error.status || 400)
          .send({ message: error.message || "Erro ao criar cliente", error });
      }
    }
  );

  // Editar cliente
  fastify.put(
    "/cliente/:cliente_id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const clienteId = Number(
          (request.params as { cliente_id: string }).cliente_id
        );
        const cliente = await ClienteController.editarCliente(
          clienteId,
          request.body as any,
          usuario
        );
        return reply.status(200).send(cliente);
      } catch (error: any) {
        return reply
          .status(error.status || 400)
          .send({ message: error.message || "Erro ao editar cliente", error });
      }
    }
  );

  // Remover cliente (soft delete)
  fastify.delete(
    "/cliente/:cliente_id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const clienteId = Number(
          (request.params as { cliente_id: string }).cliente_id
        );
        await ClienteController.removerCliente(clienteId, usuario);
        return reply.status(204).send();
      } catch (error: any) {
        return reply
          .status(error.status || 400)
          .send({ message: error.message || "Erro ao remover cliente", error });
      }
    }
  );
}
