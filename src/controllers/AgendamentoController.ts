import { AppDataSource } from "../data-source";
import { Agendamento } from "../entity/Agendamento";
import { Cliente } from "../entity/Cliente";
import { Funcionario } from "../entity/Funcionario";
import { Administrador } from "../entity/Administrador";

export class AgendamentoController {
  // Verificar se o usuário tem acesso à empresa
  private static async verificarAcessoEmpresa(
    empresaId: number,
    usuario: { usuarioId: number; pessoaId: number }
  ): Promise<boolean> {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);

    // Verificar se é admin (tem acesso a todas as empresas)
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    if (isAdmin) return true;

    // Verificar se é funcionário da empresa
    const funcionario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId,
    });
    if (funcionario) return true;

    // Verificar se é cliente da empresa
    const cliente = await clienteRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId,
    });
    if (cliente) return true;

    return false;
  }

  // Verificar se o usuário tem acesso ao agendamento
  private static async verificarAcessoAgendamento(
    agendamentoId: number,
    usuario: { usuarioId: number; pessoaId: number }
  ): Promise<boolean> {
    const agendamentoRepo = AppDataSource.getRepository(Agendamento);
    const { IsNull } = require("typeorm");

    const agendamento = await agendamentoRepo.findOne({
      where: { agendamentoId, deletedAt: IsNull() },
      relations: ["cliente", "funcionario"],
    });

    if (!agendamento) return false;

    // Verificar acesso à empresa do agendamento
    const temAcessoEmpresa = await this.verificarAcessoEmpresa(
      agendamento.empresaId,
      usuario
    );
    if (!temAcessoEmpresa) return false;

    // Verificar se é o próprio cliente ou funcionário do agendamento
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);

    const funcionarioUsuario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      funcionarioId: agendamento.funcionarioId,
    });

    const clienteUsuario = await clienteRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      clienteId: agendamento.clienteId,
    });

    return !!(
      funcionarioUsuario ||
      clienteUsuario ||
      (await this.isAdmin(usuario))
    );
  }

  // Verificar se é administrador
  private static async isAdmin(usuario: {
    usuarioId: number;
    pessoaId: number;
  }): Promise<boolean> {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const admin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    return !!admin;
  }
  // Criar novo agendamento
  static async criarAgendamento(
    dados: {
      clienteId: number;
      funcionarioId: number;
      servicoId: number;
      empresaId: number;
      dataAgendamento: string; // String YYYY-MM-DD
      horarioInicio: string; // HH:mm
      horarioFim: string; // HH:mm
      valor?: string;
      observacoes?: string;
    },
    usuario: { usuarioId: number; pessoaId: number }
  ) {
    const {
      empresaId,
      clienteId,
      dataAgendamento,
      funcionarioId,
      horarioFim,
      horarioInicio,
      servicoId,
      observacoes,
      valor,
    } = dados;
    // Verificar acesso à empresa
    const temAcesso = await this.verificarAcessoEmpresa(
      dados.empresaId,
      usuario
    );
    if (!temAcesso) {
      throw {
        status: 403,
        message: "Acesso negado à empresa.",
      };
    }

    const agendamentoRepo = AppDataSource.getRepository(Agendamento);

    console.log("Dados recebidos para criar agendamento:", dados, empresaId);

    const [ano, mes, dia] = dataAgendamento?.split("-").map(Number);
    const dataAgendamentoDate = new Date(ano, mes - 1, dia);

    try {
      const novoAgendamento = agendamentoRepo.create({
        empresaId: empresaId,
        clienteId: clienteId,
        funcionarioId: funcionarioId,
        servicoId: servicoId,
        dataAgendamento: dataAgendamentoDate,
        horarioInicio: horarioInicio,
        horarioFim: horarioFim,
        valor: valor?.toString(),
        observacoes: observacoes,
        status: "agendado",
      });

      console.log("Agendamento criado (antes de salvar):", novoAgendamento);

      const agendamentoSalvo = await agendamentoRepo.save(novoAgendamento);

      console.log("Agendamento salvo:", agendamentoSalvo);

      return agendamentoSalvo;
    } catch (error: any) {
      console.error("Erro ao salvar agendamento:", error);
      throw new Error(`Erro ao criar agendamento: ${error.message}`);
    }
  }

  // Versão básica sem filtros
  static async listarAgendamentos() {
    const agendamentoRepo = AppDataSource.getRepository(Agendamento);

    const agendamentos = await agendamentoRepo.find({
      relations: {
        cliente: {
          pessoa: true,
        },
        funcionario: {
          pessoa: true,
        },
        servico: true,
        empresa: true,
      },

      order: {
        dataAgendamento: "DESC",
        horarioInicio: "ASC",
      },
    });

    return agendamentos;
  }

  // Versão completa com filtros baseada na estrutura real
  // Listar agendamentos com filtros COM relacionamentos
  static async listarAgendamentosComFiltros(filtros: {
    status?: string;
    dataInicio?: string;
    dataFim?: string;
    clienteId?: number;
    funcionarioId?: number;
    servicoId?: number;
    empresaId?: number;
  }) {
    const agendamentoRepo = AppDataSource.getRepository(Agendamento);
    const queryBuilder = agendamentoRepo.createQueryBuilder("agendamento");

    // Joins para trazer os relacionamentos
    queryBuilder
      .leftJoinAndSelect("agendamento.cliente", "cliente")
      .leftJoinAndSelect("cliente.pessoa", "clientePessoa")
      .leftJoinAndSelect("agendamento.funcionario", "funcionario")
      .leftJoinAndSelect("funcionario.pessoa", "funcionarioPessoa")
      .leftJoinAndSelect("agendamento.servico", "servico")
      .leftJoinAndSelect("agendamento.empresa", "empresa");

    // Filtro padrão para não mostrar deletados
    queryBuilder.where("agendamento.deletedAt IS NULL");

    // Aplicar filtros com validação
    if (filtros.status) {
      queryBuilder.andWhere("agendamento.status = :status", {
        status: filtros.status,
      });
    }

    if (filtros.dataInicio) {
      // Validar formato da data antes de usar
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(filtros.dataInicio)) {
        queryBuilder.andWhere("agendamento.dataAgendamento >= :dataInicio", {
          dataInicio: filtros.dataInicio,
        });
      } else {
        console.warn("Formato de dataInicio inválido:", filtros.dataInicio);
      }
    }

    if (filtros.dataFim) {
      // Validar formato da data antes de usar
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(filtros.dataFim)) {
        queryBuilder.andWhere("agendamento.dataAgendamento <= :dataFim", {
          dataFim: filtros.dataFim,
        });
      } else {
        console.warn("Formato de dataFim inválido:", filtros.dataFim);
      }
    }

    if (filtros.clienteId) {
      queryBuilder.andWhere("agendamento.clienteId = :clienteId", {
        clienteId: filtros.clienteId,
      });
    }

    if (filtros.funcionarioId) {
      queryBuilder.andWhere("agendamento.funcionarioId = :funcionarioId", {
        funcionarioId: filtros.funcionarioId,
      });
    }

    if (filtros.servicoId) {
      queryBuilder.andWhere("agendamento.servicoId = :servicoId", {
        servicoId: filtros.servicoId,
      });
    }

    if (filtros.empresaId) {
      queryBuilder.andWhere("agendamento.empresaId = :empresaId", {
        empresaId: filtros.empresaId,
      });
    }

    // Ordenação
    queryBuilder
      .orderBy("agendamento.dataAgendamento", "DESC")
      .addOrderBy("agendamento.horarioInicio", "ASC");

    const agendamentos = await queryBuilder.getMany();
    return agendamentos;
  }

  // Buscar agendamento por ID
  static async buscarAgendamentoPorId(
    agendamentoId: number,
    usuario?: { usuarioId: number; pessoaId: number }
  ) {
    const agendamentoRepo = AppDataSource.getRepository(Agendamento);
    const { IsNull } = require("typeorm");

    const agendamento = await agendamentoRepo.findOne({
      where: {
        agendamentoId,
        deletedAt: IsNull(),
      },
      relations: ["cliente", "funcionario", "servico", "empresa"],
    });

    if (!agendamento) {
      throw {
        status: 404,
        message: "Agendamento não encontrado.",
      };
    }

    // Se usuário fornecido, verificar acesso
    if (usuario) {
      const temAcesso = await this.verificarAcessoAgendamento(
        agendamentoId,
        usuario
      );
      if (!temAcesso) {
        throw {
          status: 403,
          message: "Acesso negado ao agendamento.",
        };
      }
    }

    return agendamento;
  }

  // Atualizar agendamento
  static async atualizarAgendamento(
    agendamentoId: number,
    dados: {
      funcionarioId?: number;
      servicoId?: number;
      dataAgendamento?: string; // YYYY-MM-DD
      horarioInicio?: string; // HH:mm
      horarioFim?: string; // HH:mm
      valor?: number;
      observacoes?: string;
      status?: string;
    },
    usuario: { usuarioId: number; pessoaId: number }
  ) {
    const agendamentoRepo = AppDataSource.getRepository(Agendamento);

    console.log("Dados recebidos para atualizar agendamento:", dados);

    // Buscar agendamento existente
    const agendamento = await this.buscarAgendamentoPorId(agendamentoId);

    if (!agendamento) {
      throw new Error("Agendamento não encontrado");
    }

    // Verificar se o agendamento pode ser atualizado
    if (agendamento.status === "concluido") {
      throw {
        status: 400,
        message: "Não é possível atualizar um agendamento já concluído.",
      };
    }

    // Validar formato da data se fornecida
    if (dados.dataAgendamento) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dados.dataAgendamento)) {
        throw new Error("Formato de data inválido. Use YYYY-MM-DD");
      }

      const dataTest = new Date(dados.dataAgendamento);
      if (isNaN(dataTest.getTime())) {
        throw new Error("Data de agendamento inválida");
      }
    }

    // Validar formato dos horários se fornecidos
    const timeRegex = /^\d{2}:\d{2}$/;
    if (dados.horarioInicio && !timeRegex.test(dados.horarioInicio)) {
      throw new Error("Formato de horário de início inválido. Use HH:mm");
    }
    if (dados.horarioFim && !timeRegex.test(dados.horarioFim)) {
      throw new Error("Formato de horário de fim inválido. Use HH:mm");
    }

    // Se está alterando dados que podem causar conflito, verificar
    if (
      dados.horarioInicio ||
      dados.horarioFim ||
      dados.funcionarioId ||
      dados.dataAgendamento
    ) {
      const funcionarioId = dados.funcionarioId || agendamento.funcionarioId;
      const dataAgendamento =
        dados.dataAgendamento ||
        (agendamento.dataAgendamento instanceof Date
          ? agendamento.dataAgendamento.toISOString().split("T")[0]
          : agendamento.dataAgendamento);
      const horarioInicio = dados.horarioInicio || agendamento.horarioInicio;
      const horarioFim = dados.horarioFim || agendamento.horarioFim;

      console.log("Verificando conflitos para atualização:", {
        funcionarioId,
        dataAgendamento,
        horarioInicio,
        horarioFim,
        agendamentoId,
      });

      // Usar o método de verificação de conflito já existente
      const conflitos = await this.verificarConflito({
        funcionarioId,
        dataAgendamento,
        horarioInicio,
        horarioFim,
        agendamentoId, // Excluir o próprio agendamento da verificação
      });

      if (conflitos.length > 0) {
        throw {
          status: 409,
          message:
            "Já existe um agendamento para este funcionário neste horário.",
          conflitos,
        };
      }
    }

    try {
      // Preparar dados para atualização
      const dadosAtualizacao: any = {};

      if (dados.funcionarioId !== undefined)
        dadosAtualizacao.funcionarioId = dados.funcionarioId;
      if (dados.servicoId !== undefined)
        dadosAtualizacao.servicoId = dados.servicoId;
      if (dados.dataAgendamento !== undefined) {
        dadosAtualizacao.dataAgendamento = new Date(dados.dataAgendamento);
      }
      if (dados.horarioInicio !== undefined)
        dadosAtualizacao.horarioInicio = dados.horarioInicio;
      if (dados.horarioFim !== undefined)
        dadosAtualizacao.horarioFim = dados.horarioFim;
      if (dados.valor !== undefined)
        dadosAtualizacao.valor = dados.valor.toString();
      if (dados.observacoes !== undefined)
        dadosAtualizacao.observacoes = dados.observacoes;
      if (dados.status !== undefined) dadosAtualizacao.status = dados.status;

      // Sempre atualizar o updatedAt
      dadosAtualizacao.updatedAt = new Date();

      console.log("Dados preparados para atualização:", dadosAtualizacao);

      // Atualizar campos
      Object.assign(agendamento, dadosAtualizacao);

      const agendamentoAtualizado = await agendamentoRepo.save(agendamento);

      console.log("Agendamento atualizado:", agendamentoAtualizado);

      return agendamentoAtualizado;
    } catch (error: any) {
      console.error("Erro ao atualizar agendamento:", error);
      throw new Error(`Erro ao atualizar agendamento: ${error.message}`);
    }
  }

  // Alterar status do agendamento
  static async alterarStatusAgendamento(
    agendamentoId: number,
    novoStatus:
      | "agendado"
      | "confirmado"
      | "em_andamento"
      | "concluido"
      | "cancelado",
    usuario: { usuarioId: number; pessoaId: number }
  ) {
    const agendamentoRepo = AppDataSource.getRepository(Agendamento);

    const agendamento = await this.buscarAgendamentoPorId(
      agendamentoId,
      usuario
    );

    // Validar transições de status
    const transicoesValidas: Record<string, string[]> = {
      agendado: ["confirmado", "cancelado"],
      confirmado: ["em_andamento", "cancelado"],
      em_andamento: ["concluido", "cancelado"],
      concluido: [], // Status final
      cancelado: ["agendado"], // Pode reagendar
    };

    if (!transicoesValidas[agendamento.status].includes(novoStatus)) {
      throw {
        status: 400,
        message: `Não é possível alterar o status de "${agendamento.status}" para "${novoStatus}".`,
      };
    }

    agendamento.status = novoStatus;
    agendamento.updatedAt = new Date();

    return await agendamentoRepo.save(agendamento);
  }

  // Cancelar agendamento (soft delete)
  static async cancelarAgendamento(
    agendamentoId: number,
    usuario: { usuarioId: number; pessoaId: number }
  ) {
    return await this.alterarStatusAgendamento(
      agendamentoId,
      "cancelado",
      usuario
    );
  }

  // Excluir agendamento (soft delete)
  static async excluirAgendamento(
    agendamentoId: number,
    usuario: { usuarioId: number; pessoaId: number }
  ) {
    const agendamentoRepo = AppDataSource.getRepository(Agendamento);

    const agendamento = await this.buscarAgendamentoPorId(
      agendamentoId,
      usuario
    );

    // Só pode excluir se estiver cancelado
    if (agendamento.status !== "cancelado") {
      throw {
        status: 400,
        message: "Apenas agendamentos cancelados podem ser excluídos.",
      };
    }

    agendamento.deletedAt = new Date();

    return await agendamentoRepo.save(agendamento);
  }

  // Buscar agenda do funcionário por data
  static async buscarAgendaFuncionario(
    funcionarioId: number,
    data: Date,
    usuario?: { usuarioId: number; pessoaId: number }
  ) {
    // Se usuário fornecido, verificar se tem acesso ao funcionário
    if (usuario) {
      const funcionarioRepo = AppDataSource.getRepository(Funcionario);
      const funcionario = await funcionarioRepo.findOneBy({ funcionarioId });

      if (!funcionario) {
        throw {
          status: 404,
          message: "Funcionário não encontrado.",
        };
      }

      const temAcesso = await this.verificarAcessoEmpresa(
        funcionario.empresaId,
        usuario
      );
      if (!temAcesso) {
        throw {
          status: 403,
          message: "Acesso negado à empresa do funcionário.",
        };
      }
    }

    const agendamentoRepo = AppDataSource.getRepository(Agendamento);
    const { Not, IsNull } = require("typeorm");

    return await agendamentoRepo.find({
      where: {
        funcionarioId,
        dataAgendamento: data,
        status: Not("cancelado"),
        deletedAt: IsNull(),
      },
      relations: ["cliente", "servico"],
      order: {
        horarioInicio: "ASC",
      },
    });
  }

  // Buscar agendamentos do cliente
  static async buscarAgendamentosCliente(
    clienteId: number,
    filtros?: {
      status?: string;
      dataInicio?: Date;
      dataFim?: Date;
    },
    usuario?: { usuarioId: number; pessoaId: number }
  ) {
    // Se usuário fornecido, verificar se tem acesso ao cliente
    if (usuario) {
      const clienteRepo = AppDataSource.getRepository(Cliente);
      const cliente = await clienteRepo.findOneBy({ clienteId });

      if (!cliente) {
        throw {
          status: 404,
          message: "Cliente não encontrado.",
        };
      }

      const temAcesso = await this.verificarAcessoEmpresa(
        cliente.empresaId,
        usuario
      );
      if (!temAcesso) {
        throw {
          status: 403,
          message: "Acesso negado à empresa do cliente.",
        };
      }
    }

    const agendamentoRepo = AppDataSource.getRepository(Agendamento);
    const {
      Between,
      MoreThanOrEqual,
      LessThanOrEqual,
      IsNull,
    } = require("typeorm");

    // Construir condições where
    const whereConditions: any = {
      clienteId,
      deletedAt: IsNull(),
    };

    if (filtros?.status) {
      whereConditions.status = filtros.status;
    }

    if (filtros?.dataInicio && filtros?.dataFim) {
      whereConditions.dataAgendamento = Between(
        filtros.dataInicio,
        filtros.dataFim
      );
    } else if (filtros?.dataInicio) {
      whereConditions.dataAgendamento = MoreThanOrEqual(filtros.dataInicio);
    } else if (filtros?.dataFim) {
      whereConditions.dataAgendamento = LessThanOrEqual(filtros.dataFim);
    }

    return await agendamentoRepo.find({
      where: whereConditions,
      relations: ["funcionario", "servico", "empresa"],
      order: {
        dataAgendamento: "DESC",
        horarioInicio: "DESC",
      },
    });
  }
  static async verificarConflito(dados: {
    funcionarioId: number;
    dataAgendamento: string; // String YYYY-MM-DD
    horarioInicio: string;
    horarioFim: string;
    agendamentoId?: number; // Para edição
  }) {
    const agendamentoRepo = AppDataSource.getRepository(Agendamento);
    const queryBuilder = agendamentoRepo.createQueryBuilder("agendamento");

    // Converter string para Date
    const dataAgendamento = new Date(dados.dataAgendamento);

    if (isNaN(dataAgendamento.getTime())) {
      throw new Error(
        "Data de agendamento inválida para verificação de conflito"
      );
    }

    console.log("Verificando conflito para data:", dataAgendamento);

    queryBuilder
      .where("agendamento.funcionarioId = :funcionarioId", {
        funcionarioId: dados.funcionarioId,
      })
      .andWhere("agendamento.dataAgendamento = :dataAgendamento", {
        dataAgendamento: dataAgendamento,
      })
      .andWhere("agendamento.deletedAt IS NULL")
      .andWhere("agendamento.status != :statusCancelado", {
        statusCancelado: "cancelado",
      })
      .andWhere(
        "(agendamento.horarioInicio < :horarioFim AND agendamento.horarioFim > :horarioInicio)",
        {
          horarioInicio: dados.horarioInicio,
          horarioFim: dados.horarioFim,
        }
      );

    // Se for edição, excluir o próprio agendamento da verificação
    if (dados.agendamentoId) {
      queryBuilder.andWhere("agendamento.agendamentoId != :agendamentoId", {
        agendamentoId: dados.agendamentoId,
      });
    }

    const conflitos = await queryBuilder.getMany();
    return conflitos;
  }
}
