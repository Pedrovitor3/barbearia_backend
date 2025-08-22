import { AgendamentoController } from "@/controllers/AgendamentoController";
import { FastifyInstance } from "fastify";

interface AuthenticatedUser {
  usuarioId: number;
  pessoaId: number;
}
interface AgendamentoBody {
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  clienteId?: number;
  funcionarioId?: number;
  servicoId?: number;
  empresaId?: number;
  incluirRelacoes?: boolean;
  dataAgendamento: string;
}

interface AgendamentoParams {
  agendamento_id: string;
}

interface FuncionarioAgendaParams {
  funcionario_id: string;
  data: string;
}

interface ClienteAgendamentosParams {
  cliente_id: string;
}

export default async function agendamentoRoutes(fastify: FastifyInstance) {
  // Listar agendamentos com filtros
  fastify.post<{ Body: AgendamentoBody }>(
    "/agendamentos",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const {
          status,
          dataInicio,
          dataFim,
          clienteId,
          funcionarioId,
          servicoId,
          empresaId,
          incluirRelacoes = true, // Default true para sempre incluir relacionamentos
        } = request.body;

        // Montar filtros apenas com campos de filtro (sem incluirRelacoes)
        const filtros: any = {};
        if (status) filtros.status = status;
        if (dataInicio) filtros.dataInicio = dataInicio;
        if (dataFim) filtros.dataFim = dataFim;
        if (clienteId) filtros.clienteId = clienteId;
        if (funcionarioId) filtros.funcionarioId = funcionarioId;
        if (servicoId) filtros.servicoId = servicoId;
        if (empresaId) filtros.empresaId = empresaId;

        // DEBUG: Log dos filtros montados
        console.log("Filtros montados:", filtros);
        console.log("Incluir relações:", incluirRelacoes);
        console.log("Quantidade de filtros:", Object.keys(filtros).length);

        let agendamentos;

        // Escolher método baseado se tem filtros E se quer relacionamentos
        if (Object.keys(filtros).length === 0) {
          console.log("Executando sem filtros");

          agendamentos = await AgendamentoController.listarAgendamentos();
        } else {
          console.log("Executando com filtros:", filtros);

          agendamentos =
            await AgendamentoController.listarAgendamentosComFiltros(filtros);
        }

        return reply.status(200).send({
          success: true,
          data: agendamentos,
          total: agendamentos.length,
          filtros: filtros,
          incluirRelacoes: incluirRelacoes,
        });
      } catch (error: any) {
        console.error("Erro ao buscar agendamentos:", error);
        return reply.status(error.status || 500).send({
          success: false,
          message: error.message || "Erro ao buscar agendamentos",
        });
      }
    }
  );

  // Rota GET simples para listar todos os agendamentos (sempre com relacionamentos)
  fastify.get(
    "/agendamentos",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const agendamentos = await AgendamentoController.listarAgendamentos();

        return reply.status(200).send({
          success: true,
          data: agendamentos,
          total: agendamentos.length,
        });
      } catch (error: any) {
        console.error("Erro ao buscar agendamentos:", error);
        return reply.status(error.status || 500).send({
          success: false,
          message: error.message || "Erro ao buscar agendamentos",
        });
      }
    }
  );

  // Rota para buscar agendamento específico por ID (com relacionamentos)
  fastify.get<{ Params: { id: string } }>(
    "/agendamentos/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const agendamento = await AgendamentoController.buscarAgendamentoPorId(
          Number(id)
        );

        if (!agendamento) {
          return reply.status(404).send({
            success: false,
            message: "Agendamento não encontrado",
          });
        }

        return reply.status(200).send({
          success: true,
          data: agendamento,
        });
      } catch (error: any) {
        console.error("Erro ao buscar agendamento:", error);
        return reply.status(error.status || 500).send({
          success: false,
          message: error.message || "Erro ao buscar agendamento",
        });
      }
    }
  );

  // Criar novo agendamento
  fastify.post(
    "/agendamento",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const dadosAgendamento = request.body as {
          empresaId: number;
          clienteId: number;
          funcionarioId: number;
          servicoId: number;
          dataAgendamento: string;
          horarioInicio: string;
          horarioFim: string;
          valor?: string;
          observacoes?: string;
        };

        const agendamento = await AgendamentoController.criarAgendamento(
          dadosAgendamento,
          usuario
        );
        return reply.status(201).send(agendamento);
      } catch (error: any) {
        return reply.status(error.status || 400).send({
          message: error.message || "Erro ao criar agendamento",
          error,
        });
      }
    }
  );

  // Atualizar agendamento
  fastify.put<{ Params: AgendamentoParams }>(
    "/agendamentos/:agendamento_id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const agendamentoId = Number(request.params.agendamento_id);
        const dadosAtualizacao = request.body as {
          funcionarioId?: number;
          servicoId?: number;
          dataAgendamento?: string;
          horarioInicio?: string;
          horarioFim?: string;
          valor?: string;
          observacoes?: string;
        };

        // Converter data string para Date se fornecida
        const agendamentoData: any = { ...dadosAtualizacao };
        if (dadosAtualizacao.dataAgendamento) {
          agendamentoData.dataAgendamento = new Date(
            dadosAtualizacao.dataAgendamento
          );
        }

        const agendamento = await AgendamentoController.atualizarAgendamento(
          agendamentoId,
          agendamentoData,
          usuario
        );
        return reply.status(200).send(agendamento);
      } catch (error: any) {
        return reply.status(error.status || 400).send({
          message: error.message || "Erro ao atualizar agendamento",
          error,
        });
      }
    }
  );

  // Alterar status do agendamento
  fastify.patch<{ Params: AgendamentoParams }>(
    "/agendamentos/:agendamento_id/status",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const agendamentoId = Number(request.params.agendamento_id);
        const { status } = request.body as {
          status:
            | "agendado"
            | "confirmado"
            | "em_andamento"
            | "concluido"
            | "cancelado";
        };

        const agendamento =
          await AgendamentoController.alterarStatusAgendamento(
            agendamentoId,
            status,
            usuario
          );
        return reply.status(200).send(agendamento);
      } catch (error: any) {
        return reply.status(error.status || 400).send({
          message: error.message || "Erro ao alterar status do agendamento",
          error,
        });
      }
    }
  );

  // Cancelar agendamento
  fastify.patch<{ Params: AgendamentoParams }>(
    "/agendamentos/:agendamento_id/cancelar",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const agendamentoId = Number(request.params.agendamento_id);

        const agendamento = await AgendamentoController.cancelarAgendamento(
          agendamentoId,
          usuario
        );
        return reply.status(200).send(agendamento);
      } catch (error: any) {
        return reply.status(error.status || 400).send({
          message: error.message || "Erro ao cancelar agendamento",
          error,
        });
      }
    }
  );

  // Excluir agendamento (soft delete)
  fastify.delete<{ Params: AgendamentoParams }>(
    "/agendamentos/:agendamento_id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const agendamentoId = Number(request.params.agendamento_id);

        const agendamento = await AgendamentoController.excluirAgendamento(
          agendamentoId,
          usuario
        );
        return reply
          .status(200)
          .send({ message: "Agendamento excluído com sucesso" });
      } catch (error: any) {
        return reply.status(error.status || 400).send({
          message: error.message || "Erro ao excluir agendamento",
          error,
        });
      }
    }
  );

  // Buscar agenda do funcionário por data
  fastify.get<{ Params: FuncionarioAgendaParams }>(
    "/funcionarios/:funcionario_id/agenda/:data",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const funcionarioId = Number(request.params.funcionario_id);
        const data = new Date(request.params.data);

        const agenda = await AgendamentoController.buscarAgendaFuncionario(
          funcionarioId,
          data,
          usuario
        );
        return reply.status(200).send(agenda);
      } catch (error: any) {
        return reply.status(error.status || 400).send({
          message: error.message || "Erro ao buscar agenda do funcionário",
          error,
        });
      }
    }
  );

  // Buscar agendamentos do cliente
  fastify.get<{
    Params: ClienteAgendamentosParams;
    Querystring: { status?: string; dataInicio?: string; dataFim?: string };
  }>(
    "/clientes/:cliente_id/agendamentos",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const clienteId = Number(request.params.cliente_id);
        const query = request.query;

        const filtros = {
          status: query.status,
          dataInicio: query.dataInicio ? new Date(query.dataInicio) : undefined,
          dataFim: query.dataFim ? new Date(query.dataFim) : undefined,
        };

        const agendamentos =
          await AgendamentoController.buscarAgendamentosCliente(
            clienteId,
            filtros,
            usuario
          );
        return reply.status(200).send(agendamentos);
      } catch (error: any) {
        return reply.status(error.status || 400).send({
          message: error.message || "Erro ao buscar agendamentos do cliente",
          error,
        });
      }
    }
  );
}
