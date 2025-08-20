import { AppDataSource } from "@/data-source";
import { Administrador } from "@/entity/Administrador";
import { Funcionario } from "@/entity/Funcionario";
import { Pessoa } from "@/entity/Pessoa";
import { Usuario } from "@/entity/Usuario";
import { Empresa } from "@/entity/Empresa"; // Adicione esta importação

interface AuthenticatedUser {
  usuarioId: number;
  pessoaId: number;
}

export class FuncionarioController {
  static async criarFuncionario(
    funcionarioData: {
      nome: string;
      sobrenome: string;
      cpf?: string;
      dataNascimento?: string;
      sexo?: string;
      email?: string;
      username?: string;
      empresaId: number;
      cargo: string;
      dataAdmissao: string;
    },
    usuarioLogado: AuthenticatedUser
  ) {
    console.log("teste entrou controller");
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const pessoaRepo = AppDataSource.getRepository(Pessoa);
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const empresaRepo = AppDataSource.getRepository(Empresa); // Adicione esta linha
    const bcrypt = require("bcrypt");

    // 0. VALIDAÇÃO: Verificar se a empresa existe
    const empresaExiste = await empresaRepo.findOneBy({
      empresaId: funcionarioData.empresaId,
    });

    if (!empresaExiste) {
      throw {
        status: 400,
        message: `Empresa com ID ${funcionarioData.empresaId} não encontrada.`,
      };
    }

    // 1. Permissão (mantém igual)
    const isAdmin = await adminRepo.findOneBy({
      pessoaId: usuarioLogado.pessoaId,
    });
    let podeCriar = false;
    if (isAdmin) {
      podeCriar = true;
    } else {
      const dono = await funcionarioRepo.findOneBy({
        pessoaId: usuarioLogado.pessoaId,
        empresaId: funcionarioData.empresaId,
        cargo: "dono",
      });
      if (dono) podeCriar = true;
    }
    if (!podeCriar) {
      throw {
        status: 403,
        message: "Sem permissão para criar funcionário nesta empresa.",
      };
    }

    // 2. Pessoa (modificado para incluir email)
    let pessoa: any;
    if (funcionarioData.cpf) {
      pessoa = await pessoaRepo.findOneBy({ cpf: funcionarioData.cpf });
    }
    if (!pessoa) {
      pessoa = pessoaRepo.create({
        nome: funcionarioData.nome,
        sobrenome: funcionarioData.sobrenome,
        cpf: funcionarioData.cpf,
        dataNascimento: funcionarioData.dataNascimento,
        sexo: funcionarioData.sexo,
        email: funcionarioData.email,
      });
      pessoa = await pessoaRepo.save(pessoa);
    } else {
      // Se a pessoa já existe, atualize o email se fornecido
      if (funcionarioData.email && pessoa.email !== funcionarioData.email) {
        pessoa.email = funcionarioData.email;
        pessoa = await pessoaRepo.save(pessoa);
      }
    }

    // 3. e 4. Usuário e Funcionário (mantém igual)
    let usuario: any = await usuarioRepo.findOneBy({
      pessoaId: pessoa.pessoaId,
    });
    if (!usuario) {
      const username = funcionarioData.username;
      const senhaFixa = "teste123";
      const senhaHash = await bcrypt.hash(senhaFixa, 10);
      usuario = usuarioRepo.create({
        pessoaId: pessoa.pessoaId,
        username,
        senhaHash,
        ativo: true,
      });
      usuario = await usuarioRepo.save(usuario);
    }

    let funcionario = await funcionarioRepo.findOneBy({
      pessoaId: pessoa.pessoaId,
      empresaId: funcionarioData.empresaId,
    });
    if (funcionario) {
      throw {
        status: 400,
        message: "Funcionário já existe para esta empresa.",
      };
    }
    funcionario = funcionarioRepo.create({
      pessoaId: pessoa.pessoaId,
      empresaId: funcionarioData.empresaId,
      cargo: funcionarioData.cargo,
      dataAdmissao: funcionarioData.dataAdmissao,
      ativo: true,
    });
    funcionario = await funcionarioRepo.save(funcionario);

    return funcionario;
  }

  static async editarFuncionario(
    funcionarioId: number,
    funcionarioData: Partial<{
      cargo: string;
      salario?: string;
      dataAdmissao?: string;
      dataDemissao?: string;
      ativo?: boolean;
      email?: string;
      nome?: string;
      sobrenome?: string;
      cpf?: string;
      dataNascimento?: string;
      sexo?: string;
    }>,
    usuarioLogado: AuthenticatedUser
  ) {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const pessoaRepo = AppDataSource.getRepository(Pessoa);

    // Busca o funcionário com os dados da pessoa
    let funcionario = await funcionarioRepo.findOne({
      where: { funcionarioId },
      relations: ["pessoa"], // Incluir a relação com pessoa
    });

    if (!funcionario) {
      throw { status: 404, message: "Funcionário não encontrado." };
    }

    // Permissão: admin pode tudo, funcionário dono só na própria empresa
    const isAdmin = await adminRepo.findOneBy({
      pessoaId: usuarioLogado.pessoaId,
    });
    let podeEditar = false;
    if (isAdmin) {
      podeEditar = true;
    } else {
      // Só pode se for dono da empresa
      const dono = await funcionarioRepo.findOneBy({
        pessoaId: usuarioLogado.pessoaId,
        empresaId: funcionario.empresaId,
        cargo: "dono",
      });
      if (dono) podeEditar = true;
    }
    if (!podeEditar) {
      throw {
        status: 403,
        message: "Sem permissão para editar funcionário nesta empresa.",
      };
    }

    // Função helper para converter data para string no formato YYYY-MM-DD
    const dateToString = (date: any): string | null => {
      if (!date) return null;

      // Se já é uma string, retorna ela
      if (typeof date === "string") return date;

      // Se é um objeto Date válido
      if (date instanceof Date && !isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }

      // Tenta converter para Date
      try {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split("T")[0];
        }
      } catch (error) {
        console.log("Erro ao converter data:", error);
      }

      return null;
    };

    // Atualiza dados do funcionário
    if (funcionarioData.cargo !== undefined) {
      funcionario.cargo = funcionarioData.cargo;
    }
    if (funcionarioData.salario !== undefined) {
      funcionario.salario = funcionarioData.salario;
    }
    if (funcionarioData.dataAdmissao !== undefined) {
      funcionario.dataAdmissao = funcionarioData.dataAdmissao
        ? new Date(funcionarioData.dataAdmissao)
        : funcionario.dataAdmissao;
    }
    if (funcionarioData.dataDemissao !== undefined) {
      funcionario.dataDemissao = funcionarioData.dataDemissao
        ? new Date(funcionarioData.dataDemissao)
        : funcionario.dataDemissao;
    }
    if (funcionarioData.ativo !== undefined) {
      funcionario.ativo = funcionarioData.ativo;
    }

    // Salva as alterações do funcionário
    funcionario = await funcionarioRepo.save(funcionario);

    // Atualiza dados da pessoa se fornecidos
    let pessoaAtualizada = false;
    if (funcionario.pessoa) {
      if (
        funcionarioData.nome !== undefined &&
        funcionarioData.nome !== funcionario.pessoa.nome
      ) {
        funcionario.pessoa.nome = funcionarioData.nome;
        pessoaAtualizada = true;
      }
      if (
        funcionarioData.sobrenome !== undefined &&
        funcionarioData.sobrenome !== funcionario.pessoa.sobrenome
      ) {
        funcionario.pessoa.sobrenome = funcionarioData.sobrenome;
        pessoaAtualizada = true;
      }
      if (
        funcionarioData.email !== undefined &&
        funcionarioData.email !== funcionario.pessoa.email
      ) {
        funcionario.pessoa.email = funcionarioData.email;
        pessoaAtualizada = true;
      }
      if (
        funcionarioData.cpf !== undefined &&
        funcionarioData.cpf !== funcionario.pessoa.cpf
      ) {
        // Verificar se o CPF já não está sendo usado por outra pessoa
        if (funcionarioData.cpf) {
          const pessoaComCpf = await pessoaRepo.findOne({
            where: { cpf: funcionarioData.cpf },
          });
          if (
            pessoaComCpf &&
            pessoaComCpf.pessoaId !== funcionario.pessoa.pessoaId
          ) {
            throw {
              status: 400,
              message: "CPF já está sendo usado por outra pessoa.",
            };
          }
        }
        funcionario.pessoa.cpf = funcionarioData.cpf;
        pessoaAtualizada = true;
      }

      // Correção da comparação de data de nascimento
      if (funcionarioData.dataNascimento !== undefined) {
        const dataNascimentoAtual = dateToString(
          funcionario.pessoa.dataNascimento
        );
        const novaDataNascimento = funcionarioData.dataNascimento;

        if (novaDataNascimento !== dataNascimentoAtual) {
          funcionario.pessoa.dataNascimento = novaDataNascimento
            ? new Date(novaDataNascimento)
            : undefined;
          pessoaAtualizada = true;
        }
      }

      if (
        funcionarioData.sexo !== undefined &&
        funcionarioData.sexo !== funcionario.pessoa.sexo
      ) {
        funcionario.pessoa.sexo = funcionarioData.sexo;
        pessoaAtualizada = true;
      }

      // Salva as alterações da pessoa se houver
      if (pessoaAtualizada) {
        await pessoaRepo.save(funcionario.pessoa);
      }
    }

    // Retorna o funcionário atualizado com os dados da pessoa
    const funcionarioAtualizado = await funcionarioRepo.findOne({
      where: { funcionarioId },
      relations: ["pessoa"],
    });

    return funcionarioAtualizado;
  }

  static async listarFuncionariosDaEmpresa(
    empresaId: number,
    usuarioLogado: AuthenticatedUser
  ) {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);

    // Permissão: admin pode tudo, funcionário dono só na própria empresa
    const isAdmin = await adminRepo.findOneBy({
      pessoaId: usuarioLogado.pessoaId,
    });
    let podeListar = false;
    if (isAdmin) {
      podeListar = true;
    } else {
      // Só pode se for dono da empresa
      const dono = await funcionarioRepo.findOneBy({
        pessoaId: usuarioLogado.pessoaId,
        empresaId,
        cargo: "dono",
      });
      if (dono) podeListar = true;
    }
    if (!podeListar) {
      throw {
        status: 403,
        message: "Sem permissão para listar funcionários desta empresa.",
      };
    }

    // Busca todos os funcionários da empresa
    const funcionarios = await funcionarioRepo.find({
      where: { empresaId },
      relations: ["pessoa"],
    });
    return funcionarios;
  }
}
