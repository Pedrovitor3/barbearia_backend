import { Cliente } from "@/entity/Cliente";
import { In } from "typeorm";
import { AppDataSource } from "@/data-source";
import { Empresa } from "@/entity/Empresa";
import { Administrador } from "@/entity/Administrador";
import { Funcionario } from "@/entity/Funcionario";

interface AuthenticatedUser {
  usuarioId: number;
  pessoaId: number;
}

export interface EmpresaDetalhada {
  empresa: Empresa;
  totalFuncionarios: number;
  totalClientes: number;
  funcionarios?: Funcionario[];
  clientes?: Cliente[];
  isAdmin: boolean;
  isFuncionario: boolean;
  isCliente: boolean;
}

export class EmpresaController {
  private static async verificarAcessoEmpresa(
    empresaId: number,
    usuario: AuthenticatedUser
  ): Promise<boolean> {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);

    // Admin tem acesso a todas
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    if (isAdmin) {
      return true;
    }

    // Verificar se é funcionário da empresa
    const isFuncionario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId,
    });
    if (isFuncionario) {
      return true;
    }

    // Verificar se é cliente da empresa
    const isCliente = await clienteRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId,
    });
    if (isCliente) {
      return true;
    }

    return false;
  }

  static async listarEmpresa(
    empresaId: number,
    usuario: { usuarioId: number; pessoaId: number },
    incluirRelacionamentos: boolean = false
  ): Promise<EmpresaDetalhada | null> {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);
    const empresaRepo = AppDataSource.getRepository(Empresa);

    // Verificar se o usuário tem acesso à empresa
    const temAcesso = await this.verificarAcessoEmpresa(empresaId, usuario);
    if (!temAcesso) {
      return null; // ou throw new Error('Acesso negado');
    }

    // Buscar a empresa
    const empresa = await empresaRepo.findOneBy({ empresaId });
    if (!empresa) {
      return null;
    }
    // Verificar o tipo de usuário
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    const funcionarioUsuario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId,
    });
    const clienteUsuario = await clienteRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId,
    });

    // Contar totais
    const totalFuncionarios = await funcionarioRepo.count({
      where: { empresaId },
    });
    const totalClientes = await clienteRepo.count({
      where: { empresaId },
    });

    // Preparar resposta básica
    const resultado: EmpresaDetalhada = {
      empresa,
      totalFuncionarios,
      totalClientes,
      isAdmin: !!isAdmin,
      isFuncionario: !!funcionarioUsuario,
      isCliente: !!clienteUsuario,
    };

    // Incluir relacionamentos detalhados se solicitado
    if (incluirRelacionamentos) {
      // Apenas admins ou funcionários podem ver listas completas
      if (isAdmin || funcionarioUsuario) {
        resultado.funcionarios = await funcionarioRepo.find({
          where: { empresaId },
          relations: ["pessoa"], // assumindo que existe relação com Pessoa
        });

        resultado.clientes = await clienteRepo.find({
          where: { empresaId },
          relations: ["pessoa"],
        });
      }
    }

    return resultado;
  }

  // Criação de empresa (apenas administradores)
  static async criarEmpresa(
    data: {
      nomeFantasia: string;
      razaoSocial: string;
      cnpj: string;
      telefone?: string;
      email?: string;
      website?: string;
      ativo?: boolean;
    },
    usuario: { usuarioId: number; pessoaId: number }
  ) {
    // Verifica se é admin pelo relacionamento
    const adminRepo = AppDataSource.getRepository(Administrador);
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    if (!isAdmin) {
      throw {
        status: 403,
        message: "Apenas administradores podem criar empresas.",
      };
    }
    const empresaRepo = AppDataSource.getRepository(Empresa);
    const empresa = empresaRepo.create(data);
    return await empresaRepo.save(empresa);
  }

  // Edição de empresa (admin ou funcionário dono da empresa)
  static async editarEmpresa(
    empresaId: number,
    data: Partial<Empresa>,
    usuario: { usuarioId: number; pessoaId: number }
  ) {
    const empresaRepo = AppDataSource.getRepository(Empresa);
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);

    // Admin pode editar qualquer empresa
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    if (isAdmin) {
      await empresaRepo.update(empresaId, data);
      return await empresaRepo.findOneByOrFail({ empresaId });
    }

    // Funcionário só pode editar se for 'dono' da empresa
    const funcionario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId,
      cargo: "dono",
    });
    if (funcionario) {
      await empresaRepo.update(empresaId, data);
      return await empresaRepo.findOneByOrFail({ empresaId });
    }

    throw { status: 403, message: "Usuário não autorizado." };
  }

  static async listarEmpresasVinculadas(
    usuario: AuthenticatedUser
  ): Promise<Empresa[]> {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);
    const empresaRepo = AppDataSource.getRepository(Empresa);

    // Se for admin, retorna todas
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    if (isAdmin) {
      return await empresaRepo.find();
    }

    // Funcionário: empresas onde é funcionário
    const funcionarios = await funcionarioRepo.find({
      where: { pessoaId: usuario.pessoaId },
    });
    const empresasFuncionarioIds = funcionarios.map((f) => f.empresaId);

    // Cliente: empresas onde é cliente
    const clientes = await clienteRepo.find({
      where: { pessoaId: usuario.pessoaId },
    });
    const empresasClienteIds = clientes.map((c) => c.empresaId);

    // Unir ids e buscar empresas
    const empresaIds = Array.from(
      new Set([...empresasFuncionarioIds, ...empresasClienteIds])
    );
    if (empresaIds.length === 0) {
      return [];
    }
    return await empresaRepo.find({ where: { empresaId: In(empresaIds) } });
  }
}
