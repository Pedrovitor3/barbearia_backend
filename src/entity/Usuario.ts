import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Pessoa } from './Pessoa';
import { Cliente } from '@/entity/Cliente';
import { Funcionario } from '@/entity/Funcionario';
import { Administrador } from '@/entity/Administrador';

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn({ name: 'usuario_id' })
    usuarioId!: number;

    @Column({ name: 'pessoa_id' })
    pessoaId!: number;

    @ManyToOne(() => Pessoa)
    @JoinColumn({ name: 'pessoa_id' })
    pessoa?: Pessoa;

    // Relação com clientes (via pessoa_id)
    @OneToMany(() => Cliente, cliente => cliente.pessoa)
    clientes?: Cliente[];

    // Relação com funcionários
    @OneToMany(() => Funcionario, funcionario => funcionario.pessoa)
    funcionarios?: Funcionario[];

    // Relação com administradores
    @OneToMany(() => Administrador, admin => admin.pessoa)
    administradores?: Administrador[];

    @Column({ length: 50, unique: true })
    username!: string;

    @Column({ name: 'senha_hash', length: 255 })
    senhaHash!: string;

    @Column({ type: 'timestamp', name: 'ultimo_login', nullable: true })
    ultimoLogin?: Date;

    @Column({ default: true })
    ativo!: boolean;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
